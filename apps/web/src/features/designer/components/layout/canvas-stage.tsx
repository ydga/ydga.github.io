import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import { GradientCanvasOverlay } from "@/features/designer/components/preview/gradient-canvas-overlay"
import type {
  CanvasSettings,
  GradientStop,
} from "@/features/designer/model/types"
import type { CanvasTool, Selection, ShapeVariant } from "@/features/designer/model/ui-types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import {
  SNAP_THRESHOLD_TRIM_PX,
  buildSnapGuideLinesTrimPx,
  guideSnapActiveForText,
  snapTextLayerBoxTrimPx,
} from "@/features/designer/lib/guide-snap"
import { normalizeBackgroundGradient } from "@/features/designer/lib/gradient-stops"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"
import {
  paintBackgroundFallback,
  renderPreviewCanvasBackground,
  renderTrimPreviewBackground,
  shouldShowBleedPreview,
} from "@/features/designer/lib/render-background"
import { TextLayerBox } from "@/features/designer/components/layout/text-layer-box"
import { ShapeLayerBox } from "@/features/designer/components/layout/shape-layer-box"
import type {
  Layer,
  ShapeLayerUpdatePatch,
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  resolveShapeLayerFillBackground,
  resolveShapeLayerVisible,
} from "@/features/designer/model/shape-layer-style"
import { resolveTextLayerVisible } from "@/features/designer/model/text-layer-style"
import {
  clampPointToTrim,
  constrainLineEnd,
  lineGeometryFromEndpoints,
} from "@/features/designer/model/line-geometry"
import { cn } from "@workspace/ui/lib/utils"

const MIN_PLACE_TEXT_W = 48
const MIN_PLACE_TEXT_H = 36
const MIN_PLACE_SHAPE_W = 8
const MIN_PLACE_SHAPE_H = 8
const TEXT_PLACE_TAP_TRIM_PX = 4
/** Defaults for tap-to-place text; keep aligned with `useDesignerLayers` `addTextLayer`. */
const DEFAULT_NEW_TEXT_W_TRIM = 200
const DEFAULT_NEW_TEXT_H_TRIM = 72
/** Defaults for tap-to-place shapes. */
const DEFAULT_NEW_SHAPE_W_TRIM = 80
const DEFAULT_NEW_SHAPE_H_TRIM = 80
const DEFAULT_NEW_LINE_W_TRIM = 120

type PlacementPreview =
  | {
      kind: "rect"
      x: number
      y: number
      w: number
      h: number
    }
  | {
      kind: "line"
      x0: number
      y0: number
      x1: number
      y1: number
    }
  | {
      kind: "pen"
      points: Array<{ x: number; y: number }>
      cursor: { x: number; y: number } | null
    }

type PlacementSession = {
  pointerId: number
  x0: number
  y0: number
}

type PenSession = {
  points: Array<{ x: number; y: number }>
}

function trimPointFromClient(
  frame: HTMLElement,
  clientX: number,
  clientY: number,
  displayScale: number
) {
  const rect = frame.getBoundingClientRect()
  return {
    x: (clientX - rect.left) / displayScale,
    y: (clientY - rect.top) / displayScale,
  }
}

function clampPlacementRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  trimW: number,
  trimH: number
): PlacementPreview {
  let x = Math.min(x0, x1)
  let y = Math.min(y0, y1)
  let w = Math.abs(x1 - x0)
  let h = Math.abs(y1 - y0)
  x = Math.max(0, Math.min(x, trimW))
  y = Math.max(0, Math.min(y, trimH))
  w = Math.max(1, Math.min(w, trimW - x))
  h = Math.max(1, Math.min(h, trimH - y))
  return { kind: "rect", x, y, w, h }
}

function placementRectFromDrag(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  trimW: number,
  trimH: number,
  square: boolean
): PlacementPreview {
  if (!square) {
    return clampPlacementRect(x0, y0, x1, y1, trimW, trimH)
  }

  const dx = x1 - x0
  const dy = y1 - y0
  const size = Math.max(Math.abs(dx), Math.abs(dy), 1)
  const sx = dx === 0 ? 1 : Math.sign(dx)
  const sy = dy === 0 ? 1 : Math.sign(dy)

  return clampPlacementRect(
    x0,
    y0,
    x0 + sx * size,
    y0 + sy * size,
    trimW,
    trimH
  )
}

function isNonElementFrameTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest("[data-designer-text-box]")) {
    return false
  }

  if (target.closest("[data-designer-shape-box]")) {
    return false
  }

  if (target.closest("[data-designer-gradient-overlay]")) {
    return false
  }

  return true
}

type CanvasStageProps = {
  settings: CanvasSettings
  registerCanvas?: (node: HTMLCanvasElement | null) => void
  displayScale: number
  isPageSelected: boolean
  onSelectPage: () => void
  onDeselectElement?: () => void
  onGradientStopsChange?: (stops: GradientStop[]) => void
  onGradientStartChange?: (x: number, y: number) => void
  onGradientEndChange?: (x: number, y: number) => void
  frameId: string
  canvasTool: CanvasTool
  shapeVariant: ShapeVariant
  selection: Selection
  frameLayers: Layer[]
  textLayers: TextLayer[]
  onPlaceText: (
    trimX: number,
    trimY: number,
    trimWidth?: number,
    trimHeight?: number
  ) => void
  onPlaceShape: (
    trimX: number,
    trimY: number,
    trimWidth: number,
    trimHeight: number,
    absolutePoints?: Array<{ x: number; y: number }>
  ) => void
  onUpdateTextLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onDuplicateLayer: (layerId: string, at?: { x: number; y: number }) => void
  onSelectTextLayer: (layerId: string) => void
  onSelectShapeLayer: (layerId: string) => void
  textLayerIdToBeginTyping: string | null
  onTextLayerBeginTypingHandled: () => void
}

export function CanvasStage({
  settings,
  registerCanvas,
  displayScale,
  isPageSelected,
  onSelectPage,
  onDeselectElement,
  onGradientStopsChange,
  onGradientStartChange,
  onGradientEndChange,
  frameId,
  canvasTool,
  shapeVariant,
  selection,
  frameLayers,
  textLayers,
  onPlaceText,
  onPlaceShape,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onDuplicateLayer,
  onSelectTextLayer,
  onSelectShapeLayer,
  textLayerIdToBeginTyping,
  onTextLayerBeginTypingHandled,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const shapeGradientBoundsRef = useRef<HTMLDivElement | null>(null)
  const textAreaRefs = useRef(new Map<string, HTMLTextAreaElement | null>())
  /** Clicks that immediately follow placement would otherwise bubble here and clear the new selection. */
  const suppressFrameClickAfterPlaceRef = useRef(false)
  const suppressFrameClickTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const placementSessionRef = useRef<PlacementSession | null>(null)
  const penSessionRef = useRef<PenSession | null>(null)
  const penCursorRef = useRef<{ x: number; y: number } | null>(null)
  const [placementPreview, setPlacementPreview] =
    useState<PlacementPreview | null>(null)
  const exportDimensions = getExportDimensions(settings)
  const previewGeometry = getPreviewGuideGeometry(settings)
  const showBleedPreview = shouldShowBleedPreview(settings)
  const { exportWidthPx, exportHeightPx, trimWidthPx, trimHeightPx } =
    exportDimensions
  const canvasWidthPx = showBleedPreview ? exportWidthPx : trimWidthPx
  const canvasHeightPx = showBleedPreview ? exportHeightPx : trimHeightPx
  const bleedDisplay = showBleedPreview
    ? previewGeometry.bleedPx * displayScale
    : 0
  const trimDisplayWidth = trimWidthPx * displayScale
  const trimDisplayHeight = trimHeightPx * displayScale
  const canvasDisplayWidth = canvasWidthPx * displayScale
  const canvasDisplayHeight = canvasHeightPx * displayScale
  const normalizedBackground = normalizeBackgroundGradient(settings.background)
  const snapGuides = useMemo(() => {
    if (!guideSnapActiveForText(settings)) {
      return null
    }
    return buildSnapGuideLinesTrimPx(settings, trimWidthPx, trimHeightPx)
  }, [settings, trimHeightPx, trimWidthPx])

  /** `overflow:hidden` on the frame would clip HTML text that paints past the layer rect when clip is off. */
  const anyTextLayerAllowsPaintOverflow = useMemo(
    () => textLayers.some((l) => l.clip === false),
    [textLayers]
  )
  const showGradientControls =
    settings.background.type === "gradient" &&
    onGradientStopsChange != null &&
    onGradientStartChange != null &&
    onGradientEndChange != null

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node
      registerCanvas?.(node)
    },
    [registerCanvas]
  )

  const armSuppressFrameClickAfterPlace = useCallback(() => {
    suppressFrameClickAfterPlaceRef.current = true
    if (suppressFrameClickTimerRef.current != null) {
      clearTimeout(suppressFrameClickTimerRef.current)
    }
    suppressFrameClickTimerRef.current = setTimeout(() => {
      suppressFrameClickTimerRef.current = null
      suppressFrameClickAfterPlaceRef.current = false
    }, 400)
  }, [])

  useEffect(() => {
    return () => {
      if (suppressFrameClickTimerRef.current != null) {
        clearTimeout(suppressFrameClickTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let cancelled = false

    canvas.width = canvasWidthPx
    canvas.height = canvasHeightPx

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.clearRect(0, 0, canvasWidthPx, canvasHeightPx)

    const paintFallback = () => {
      if (!cancelled) {
        paintBackgroundFallback(
          context,
          canvasWidthPx,
          canvasHeightPx,
          settings.background
        )
      }
    }

    if (showBleedPreview) {
      void renderPreviewCanvasBackground(context, settings).catch(paintFallback)
    } else {
      void renderTrimPreviewBackground(context, settings).catch(paintFallback)
    }

    return () => {
      cancelled = true
    }
  }, [
    canvasHeightPx,
    canvasWidthPx,
    settings.background,
    settings.guides.showBleed,
    settings.print.bleedEnabled,
    settings.print.bleed,
    showBleedPreview,
    trimHeightPx,
    trimWidthPx,
  ])

  const selectedElementId =
    selection.kind === "element" &&
    selection.pageId === frameId &&
    frameLayers.some((layer) => layer.id === selection.elementId)
      ? selection.elementId
      : null

  const selectedShapeLayer = useMemo(() => {
    if (!selectedElementId) {
      return null
    }

    const layer = frameLayers.find((entry) => entry.id === selectedElementId)
    return layer?.kind === "shape" ? layer : null
  }, [frameLayers, selectedElementId])

  const normalizedShapeFill = useMemo(() => {
    if (!selectedShapeLayer) {
      return null
    }

    const fill = resolveShapeLayerFillBackground(selectedShapeLayer)
    if (fill.type !== "gradient") {
      return null
    }

    return normalizeBackgroundGradient(fill)
  }, [selectedShapeLayer])

  const updateSelectedShapeFill = useCallback(
    (patch: ShapeLayerUpdatePatch) => {
      if (!selectedShapeLayer) {
        return
      }

      onUpdateShapeLayer(selectedShapeLayer.id, patch)
    },
    [onUpdateShapeLayer, selectedShapeLayer]
  )

  const handleShapeGradientStopsChange = useCallback(
    (stops: GradientStop[]) => {
      if (!selectedShapeLayer) {
        return
      }

      const fill = resolveShapeLayerFillBackground(selectedShapeLayer)
      updateSelectedShapeFill({
        fill: backgroundSettingsReducer(fill, {
          type: "set-background-gradient-stops",
          value: stops,
        }),
      })
    },
    [selectedShapeLayer, updateSelectedShapeFill]
  )

  const handleShapeGradientStartChange = useCallback(
    (x: number, y: number) => {
      if (!selectedShapeLayer) {
        return
      }

      const fill = resolveShapeLayerFillBackground(selectedShapeLayer)
      updateSelectedShapeFill({
        fill: backgroundSettingsReducer(fill, {
          type: "set-background-gradient-axis-start",
          value: { x, y },
        }),
      })
    },
    [selectedShapeLayer, updateSelectedShapeFill]
  )

  const handleShapeGradientEndChange = useCallback(
    (x: number, y: number) => {
      if (!selectedShapeLayer) {
        return
      }

      const fill = resolveShapeLayerFillBackground(selectedShapeLayer)
      updateSelectedShapeFill({
        fill: backgroundSettingsReducer(fill, {
          type: "set-background-gradient-axis-end",
          value: { x, y },
        }),
      })
    },
    [selectedShapeLayer, updateSelectedShapeFill]
  )

  const showShapeGradientControls = normalizedShapeFill != null

  const isPlacementTool = canvasTool === "text" || canvasTool === "shape"
  const isPenTool = canvasTool === "shape" && shapeVariant === "pen"

  const clearPenSession = useCallback(() => {
    penSessionRef.current = null
    penCursorRef.current = null
    setPlacementPreview(null)
  }, [])

  const commitPenSession = useCallback(
    (lastNode?: { x: number; y: number } | null) => {
      const session = penSessionRef.current
      if (!session) {
        clearPenSession()
        return
      }

      const points = session.points.map((p) => ({ ...p }))
      const candidate =
        lastNode ?? penCursorRef.current ?? points[points.length - 1] ?? null

      if (candidate) {
        const prev = points[points.length - 1]
        if (
          !prev ||
          Math.hypot(prev.x - candidate.x, prev.y - candidate.y) >
            TEXT_PLACE_TAP_TRIM_PX
        ) {
          points.push({ ...candidate })
        } else {
          points[points.length - 1] = { ...candidate }
        }
      }

      if (points.length < 2) {
        clearPenSession()
        return
      }

      clearPenSession()
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs)
      const maxY = Math.max(...ys)
      onPlaceShape(
        minX,
        minY,
        Math.max(1, maxX - minX),
        Math.max(1, maxY - minY),
        points
      )
      armSuppressFrameClickAfterPlace()
    },
    [armSuppressFrameClickAfterPlace, clearPenSession, onPlaceShape]
  )

  // Pen: Escape / Enter finish with the rubber-band point as the last node.
  useEffect(() => {
    if (!isPenTool) {
      penSessionRef.current = null
      penCursorRef.current = null
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter") {
        if (!penSessionRef.current || penSessionRef.current.points.length === 0) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        commitPenSession(penCursorRef.current)
      }
    }

    function onPointerMove(ev: PointerEvent) {
      const session = penSessionRef.current
      if (!session || session.points.length === 0) {
        return
      }
      const frameEl = frameRef.current
      if (!frameEl) {
        return
      }
      const pt = clampPointToTrim(
        trimPointFromClient(frameEl, ev.clientX, ev.clientY, displayScale),
        trimWidthPx,
        trimHeightPx
      )
      penCursorRef.current = pt
      setPlacementPreview({
        kind: "pen",
        points: session.points,
        cursor: pt,
      })
    }

    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("pointermove", onPointerMove)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("pointermove", onPointerMove)
    }
  }, [
    commitPenSession,
    displayScale,
    isPenTool,
    trimHeightPx,
    trimWidthPx,
  ])

  const activePlacementPreview =
    placementPreview?.kind === "pen" && !isPenTool ? null : placementPreview

  const handleFramePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPlacementTool || event.button !== 0) {
        return
      }

      const target = event.target as HTMLElement
      if (target.closest("[data-designer-text-box]")) {
        return
      }
      if (target.closest("[data-designer-shape-box]")) {
        return
      }
      if (target.closest("[data-designer-gradient-overlay]")) {
        return
      }

      event.stopPropagation()
      event.preventDefault()

      const host = frameRef.current
      if (!host) {
        return
      }

      const start = clampPointToTrim(
        trimPointFromClient(host, event.clientX, event.clientY, displayScale),
        trimWidthPx,
        trimHeightPx
      )

      // Pen tool: each click adds a node; double-click sets the last node and finishes.
      if (isPenTool) {
        if (event.detail >= 2) {
          commitPenSession(start)
          return
        }

        const session = penSessionRef.current ?? { points: [] }
        session.points.push(start)
        penSessionRef.current = session
        penCursorRef.current = start
        setPlacementPreview({
          kind: "pen",
          points: session.points,
          cursor: start,
        })
        return
      }

      placementSessionRef.current = {
        pointerId: event.pointerId,
        x0: start.x,
        y0: start.y,
      }
      if (canvasTool === "shape" && shapeVariant === "line") {
        setPlacementPreview({
          kind: "line",
          x0: start.x,
          y0: start.y,
          x1: start.x,
          y1: start.y,
        })
      } else {
        setPlacementPreview({
          kind: "rect",
          x: start.x,
          y: start.y,
          w: 0,
          h: 0,
        })
      }

      function onMove(ev: PointerEvent) {
        const session = placementSessionRef.current
        if (!session || ev.pointerId !== session.pointerId) {
          return
        }
        const frameEl = frameRef.current
        if (!frameEl) {
          return
        }
        const pt = trimPointFromClient(
          frameEl,
          ev.clientX,
          ev.clientY,
          displayScale
        )

        if (canvasTool === "shape" && shapeVariant === "line") {
          const end = clampPointToTrim(
            constrainLineEnd(session.x0, session.y0, pt.x, pt.y, ev.shiftKey),
            trimWidthPx,
            trimHeightPx
          )
          setPlacementPreview({
            kind: "line",
            x0: session.x0,
            y0: session.y0,
            x1: end.x,
            y1: end.y,
          })
          return
        }

        const r = placementRectFromDrag(
          session.x0,
          session.y0,
          pt.x,
          pt.y,
          trimWidthPx,
          trimHeightPx,
          canvasTool === "shape" && ev.shiftKey
        )
        setPlacementPreview(r)
      }

      function onUp(ev: PointerEvent) {
        const session = placementSessionRef.current
        if (!session || ev.pointerId !== session.pointerId) {
          return
        }

        placementSessionRef.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        setPlacementPreview(null)

        const frameEl = frameRef.current
        if (!frameEl) {
          return
        }
        const pt = trimPointFromClient(
          frameEl,
          ev.clientX,
          ev.clientY,
          displayScale
        )
        const dx = Math.abs(pt.x - session.x0)
        const dy = Math.abs(pt.y - session.y0)

        if (canvasTool === "shape" && shapeVariant === "line") {
          let x1: number
          let y1: number
          if (dx < TEXT_PLACE_TAP_TRIM_PX && dy < TEXT_PLACE_TAP_TRIM_PX) {
            x1 = session.x0 + DEFAULT_NEW_LINE_W_TRIM
            y1 = session.y0
          } else {
            const end = clampPointToTrim(
              constrainLineEnd(
                session.x0,
                session.y0,
                pt.x,
                pt.y,
                ev.shiftKey
              ),
              trimWidthPx,
              trimHeightPx
            )
            x1 = end.x
            y1 = end.y
          }
          const geometry = lineGeometryFromEndpoints(
            session.x0,
            session.y0,
            x1,
            y1
          )
          onPlaceShape(geometry.x, geometry.y, geometry.width, geometry.height, [
            { x: session.x0, y: session.y0 },
            { x: x1, y: y1 },
          ])
          armSuppressFrameClickAfterPlace()
          return
        }

        if (dx < TEXT_PLACE_TAP_TRIM_PX && dy < TEXT_PLACE_TAP_TRIM_PX) {
          if (canvasTool === "text") {
            if (snapGuides) {
              const s = snapTextLayerBoxTrimPx(
                session.x0,
                session.y0,
                DEFAULT_NEW_TEXT_W_TRIM,
                DEFAULT_NEW_TEXT_H_TRIM,
                snapGuides.xs,
                snapGuides.ys,
                SNAP_THRESHOLD_TRIM_PX,
                trimWidthPx,
                trimHeightPx
              )
              onPlaceText(s.x, s.y)
            } else {
              onPlaceText(session.x0, session.y0)
            }
          } else {
            onPlaceShape(
              session.x0,
              session.y0,
              DEFAULT_NEW_SHAPE_W_TRIM,
              DEFAULT_NEW_SHAPE_H_TRIM
            )
          }
        } else {
          const r = placementRectFromDrag(
            session.x0,
            session.y0,
            pt.x,
            pt.y,
            trimWidthPx,
            trimHeightPx,
            canvasTool === "shape" && ev.shiftKey
          )
          if (r.kind !== "rect") {
            return
          }
          const minW =
            canvasTool === "text" ? MIN_PLACE_TEXT_W : MIN_PLACE_SHAPE_W
          const minH =
            canvasTool === "text" ? MIN_PLACE_TEXT_H : MIN_PLACE_SHAPE_H
          const w = Math.max(minW, r.w)
          const h = Math.max(minH, r.h)
          if (canvasTool === "text") {
            if (snapGuides) {
              const s = snapTextLayerBoxTrimPx(
                r.x,
                r.y,
                w,
                h,
                snapGuides.xs,
                snapGuides.ys,
                SNAP_THRESHOLD_TRIM_PX,
                trimWidthPx,
                trimHeightPx
              )
              onPlaceText(s.x, s.y, w, h)
            } else {
              onPlaceText(r.x, r.y, w, h)
            }
          } else {
            onPlaceShape(r.x, r.y, w, h)
          }
        }
        armSuppressFrameClickAfterPlace()
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [
      armSuppressFrameClickAfterPlace,
      canvasTool,
      commitPenSession,
      displayScale,
      isPenTool,
      isPlacementTool,
      onPlaceShape,
      onPlaceText,
      shapeVariant,
      snapGuides,
      trimHeightPx,
      trimWidthPx,
    ]
  )

  const getFrameElement = useCallback(() => frameRef.current, [])

  return (
    <div
      ref={frameRef}
      data-designer-canvas-frame
      role="button"
      tabIndex={0}
      className={cn(
        "group/frame-chrome relative block shrink-0 outline-none",
        canvasTool === "text" || canvasTool === "shape"
          ? "cursor-crosshair"
          : "cursor-default",
        showBleedPreview || anyTextLayerAllowsPaintOverflow
          ? "overflow-visible"
          : "overflow-hidden"
      )}
      style={{ width: trimDisplayWidth, height: trimDisplayHeight }}
      onPointerDown={handleFramePointerDown}
      onClick={(event) => {
        if (suppressFrameClickAfterPlaceRef.current) {
          suppressFrameClickAfterPlaceRef.current = false
          if (suppressFrameClickTimerRef.current != null) {
            clearTimeout(suppressFrameClickTimerRef.current)
            suppressFrameClickTimerRef.current = null
          }
          event.preventDefault()
          event.stopPropagation()
          return
        }

        if (isPlacementTool) {
          return
        }

        if (!isNonElementFrameTarget(event.target)) {
          return
        }

        if (
          selection.kind === "element" &&
          selection.pageId === frameId &&
          onDeselectElement
        ) {
          onDeselectElement()
        }
      }}
      onDoubleClick={(event) => {
        if (suppressFrameClickAfterPlaceRef.current) {
          suppressFrameClickAfterPlaceRef.current = false
          if (suppressFrameClickTimerRef.current != null) {
            clearTimeout(suppressFrameClickTimerRef.current)
            suppressFrameClickTimerRef.current = null
          }
          event.preventDefault()
          event.stopPropagation()
          return
        }

        if (isPlacementTool) {
          return
        }

        if (!isNonElementFrameTarget(event.target)) {
          return
        }

        onSelectPage()
      }}
      onKeyDown={(event) => {
        if (isPlacementTool) {
          return
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelectPage()
        }
      }}
      aria-label="Frame canvas — double-click empty area to select frame"
    >
      <canvas
        ref={setCanvasRef}
        className={cn(
          "absolute block bg-transparent",
          !showBleedPreview && "inset-0 h-full w-full"
        )}
        style={
          showBleedPreview
            ? {
                left: -bleedDisplay,
                top: -bleedDisplay,
                width: canvasDisplayWidth,
                height: canvasDisplayHeight,
              }
            : undefined
        }
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 shadow-lg transition-shadow ring-inset",
          !isPageSelected &&
            (settings.background.type === "transparent"
              ? "ring-1 ring-foreground/20 group-hover/frame-chrome:ring-foreground/30"
              : "ring-1 ring-foreground/10 group-hover/frame-chrome:ring-foreground/20")
        )}
      />
      <GuidesOverlay settings={settings} displayScale={displayScale} />
      {activePlacementPreview && isPlacementTool ? (
        activePlacementPreview.kind === "pen" ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[14] overflow-visible"
            width={trimDisplayWidth}
            height={trimDisplayHeight}
          >
            {activePlacementPreview.points.length > 0 ? (
              <polyline
                points={[
                  ...activePlacementPreview.points,
                  ...(activePlacementPreview.cursor
                    ? [activePlacementPreview.cursor]
                    : []),
                ]
                  .map(
                    (p) =>
                      `${p.x * displayScale},${p.y * displayScale}`
                  )
                  .join(" ")}
                fill="none"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
              />
            ) : null}
            {activePlacementPreview.points.map((p, i) => (
              <rect
                key={`${i}-${p.x}-${p.y}`}
                x={p.x * displayScale - 3}
                y={p.y * displayScale - 3}
                width={6}
                height={6}
                fill="#7c3aed"
              />
            ))}
          </svg>
        ) : activePlacementPreview.kind === "line" ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[14] overflow-visible"
            width={trimDisplayWidth}
            height={trimDisplayHeight}
          >
            <line
              x1={activePlacementPreview.x0 * displayScale}
              y1={activePlacementPreview.y0 * displayScale}
              x2={activePlacementPreview.x1 * displayScale}
              y2={activePlacementPreview.y1 * displayScale}
              stroke="#7c3aed"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
          </svg>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute z-[14] border border-dashed border-[#7c3aed]"
            style={{
              left: activePlacementPreview.x * displayScale,
              top: activePlacementPreview.y * displayScale,
              width: Math.max(1, activePlacementPreview.w * displayScale),
              height: Math.max(1, activePlacementPreview.h * displayScale),
            }}
          />
        )
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[25] overflow-visible">
        {frameLayers.map((layer, index) => {
          const z = 10 + (frameLayers.length - index)

          if (layer.kind === "shape") {
            if (!resolveShapeLayerVisible(layer)) {
              return null
            }

            return (
              <ShapeLayerBox
                key={layer.id}
                layer={layer}
                displayScale={displayScale}
                trimWidthPx={trimWidthPx}
                trimHeightPx={trimHeightPx}
                isSelected={selectedElementId === layer.id}
                zIndex={z}
                getFrameElement={getFrameElement}
                onUpdate={(patch) => onUpdateShapeLayer(layer.id, patch)}
                onSelect={() => onSelectShapeLayer(layer.id)}
                onDuplicateInPlace={(at) => onDuplicateLayer(layer.id, at)}
              />
            )
          }

          if (layer.kind !== "text" || !resolveTextLayerVisible(layer)) {
            return null
          }

          return (
            <TextLayerBox
              key={layer.id}
              layer={layer}
              displayScale={displayScale}
              trimWidthPx={trimWidthPx}
              trimHeightPx={trimHeightPx}
              snapGuideXs={snapGuides?.xs ?? null}
              snapGuideYs={snapGuides?.ys ?? null}
              isSelected={selectedElementId === layer.id}
              zIndex={z}
              getFrameElement={getFrameElement}
              textLayerIdToBeginTyping={textLayerIdToBeginTyping}
              onTextLayerBeginTypingHandled={onTextLayerBeginTypingHandled}
              onUpdate={(patch) => onUpdateTextLayer(layer.id, patch)}
              onSelect={() => onSelectTextLayer(layer.id)}
              onDuplicateInPlace={(at) => onDuplicateLayer(layer.id, at)}
              onRegisterTextarea={(layerId, node) => {
                if (node) {
                  textAreaRefs.current.set(layerId, node)
                } else {
                  textAreaRefs.current.delete(layerId)
                }
              }}
            />
          )
        })}
        {showShapeGradientControls &&
        selectedShapeLayer &&
        normalizedShapeFill ? (
          <div
            ref={shapeGradientBoundsRef}
            className="pointer-events-none absolute z-[30]"
            style={{
              left: selectedShapeLayer.x * displayScale,
              top: selectedShapeLayer.y * displayScale,
              width: selectedShapeLayer.width * displayScale,
              height: selectedShapeLayer.height * displayScale,
            }}
          >
            <GradientCanvasOverlay
              boundsRef={shapeGradientBoundsRef}
              stops={normalizedShapeFill.gradientStops}
              startX={normalizedShapeFill.gradientStartX}
              startY={normalizedShapeFill.gradientStartY}
              endX={normalizedShapeFill.gradientEndX}
              endY={normalizedShapeFill.gradientEndY}
              pointerPassthrough
              onStopsChange={handleShapeGradientStopsChange}
              onStartChange={handleShapeGradientStartChange}
              onEndChange={handleShapeGradientEndChange}
            />
          </div>
        ) : null}
      </div>
      {showGradientControls ? (
        <GradientCanvasOverlay
          boundsRef={frameRef}
          stops={normalizedBackground.gradientStops}
          startX={normalizedBackground.gradientStartX}
          startY={normalizedBackground.gradientStartY}
          endX={normalizedBackground.gradientEndX}
          endY={normalizedBackground.gradientEndY}
          onStopsChange={onGradientStopsChange}
          onStartChange={onGradientStartChange}
          onEndChange={onGradientEndChange}
        />
      ) : null}
    </div>
  )
}
