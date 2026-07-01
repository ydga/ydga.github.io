import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import { SmartGuidesOverlay } from "@/features/designer/components/preview/smart-guides-overlay"
import { GradientCanvasOverlay } from "@/features/designer/components/preview/gradient-canvas-overlay"
import type {
  CanvasSettings,
  GradientStop,
} from "@/features/designer/model/types"
import type { CanvasTool, Selection } from "@/features/designer/model/ui-types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import {
  type ActiveSnapGuideLines,
  SNAP_THRESHOLD_TRIM_PX,
  buildDragSnapGuideLines,
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
import { ImageLayerBox } from "@/features/designer/components/layout/image-layer-box"
import type {
  ImageLayerUpdatePatch,
  Layer,
  ShapeLayerUpdatePatch,
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  resolveImageLayerVisible,
} from "@/features/designer/model/image-layer-style"
import {
  resolveShapeLayerFillBackground,
  resolveShapeLayerVisible,
} from "@/features/designer/model/shape-layer-style"
import { resolveTextLayerVisible } from "@/features/designer/model/text-layer-style"
import type { ShapeVariant } from "@/features/designer/model/ui-types"
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
const DEFAULT_NEW_IMAGE_W_TRIM = 200
const DEFAULT_NEW_IMAGE_H_TRIM = 150
const DEFAULT_NEW_LINE_W_TRIM = 120
const DEFAULT_NEW_LINE_H_TRIM = 4

type PlacementPreview = {
  x: number
  y: number
  w: number
  h: number
}

type PlacementSession = {
  pointerId: number
  x0: number
  y0: number
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
  return { x, y, w, h }
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

  if (target.closest("[data-designer-image-box]")) {
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
  onDismissFrameSettings?: () => void
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
    trimHeight: number
  ) => void
  onPlaceImage: (
    trimX: number,
    trimY: number,
    trimWidth: number,
    trimHeight: number
  ) => void
  onUpdateTextLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onUpdateImageLayer: (layerId: string, patch: ImageLayerUpdatePatch) => void
  onSelectTextLayer: (layerId: string) => void
  onSelectShapeLayer: (layerId: string) => void
  onSelectImageLayer: (layerId: string) => void
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
  onDismissFrameSettings,
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
  onPlaceImage,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onUpdateImageLayer,
  onSelectTextLayer,
  onSelectShapeLayer,
  onSelectImageLayer,
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
  const [placementPreview, setPlacementPreview] =
    useState<PlacementPreview | null>(null)
  const [activeSmartGuides, setActiveSmartGuides] =
    useState<ActiveSnapGuideLines | null>(null)
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

  function armSuppressFrameClickAfterPlace() {
    suppressFrameClickAfterPlaceRef.current = true
    if (suppressFrameClickTimerRef.current != null) {
      clearTimeout(suppressFrameClickTimerRef.current)
    }
    suppressFrameClickTimerRef.current = setTimeout(() => {
      suppressFrameClickTimerRef.current = null
      suppressFrameClickAfterPlaceRef.current = false
    }, 400)
  }

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

  const dragSnapGuides = useMemo(
    () =>
      buildDragSnapGuideLines(
        settings,
        trimWidthPx,
        trimHeightPx,
        frameLayers,
        selectedElementId
      ),
    [frameLayers, selectedElementId, settings, trimHeightPx, trimWidthPx]
  )

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

  const isPlacementTool =
    canvasTool === "text" || canvasTool === "shape" || canvasTool === "image"

  const handleFramePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPlacementTool || event.button !== 0) {
        return
      }

      const target = event.target as HTMLElement
      if (target.closest("[data-designer-text-box]")) {
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

      const start = trimPointFromClient(
        host,
        event.clientX,
        event.clientY,
        displayScale
      )

      placementSessionRef.current = {
        pointerId: event.pointerId,
        x0: start.x,
        y0: start.y,
      }
      setPlacementPreview({ x: start.x, y: start.y, w: 0, h: 0 })

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
        const r = placementRectFromDrag(
          session.x0,
          session.y0,
          pt.x,
          pt.y,
          trimWidthPx,
          trimHeightPx,
          (canvasTool === "shape" || canvasTool === "image") && ev.shiftKey
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

        if (dx < TEXT_PLACE_TAP_TRIM_PX && dy < TEXT_PLACE_TAP_TRIM_PX) {
          if (canvasTool === "text") {
            if (dragSnapGuides) {
              const s = snapTextLayerBoxTrimPx(
                session.x0,
                session.y0,
                DEFAULT_NEW_TEXT_W_TRIM,
                DEFAULT_NEW_TEXT_H_TRIM,
                dragSnapGuides.xs,
                dragSnapGuides.ys,
                SNAP_THRESHOLD_TRIM_PX,
                trimWidthPx,
                trimHeightPx
              )
              onPlaceText(s.x, s.y)
            } else {
              onPlaceText(session.x0, session.y0)
            }
          } else if (canvasTool === "image") {
            onPlaceImage(
              session.x0,
              session.y0,
              DEFAULT_NEW_IMAGE_W_TRIM,
              DEFAULT_NEW_IMAGE_H_TRIM
            )
          } else {
            const defaultW =
              shapeVariant === "line"
                ? DEFAULT_NEW_LINE_W_TRIM
                : DEFAULT_NEW_SHAPE_W_TRIM
            const defaultH =
              shapeVariant === "line"
                ? DEFAULT_NEW_LINE_H_TRIM
                : DEFAULT_NEW_SHAPE_H_TRIM
            onPlaceShape(session.x0, session.y0, defaultW, defaultH)
          }
        } else {
          const r = placementRectFromDrag(
            session.x0,
            session.y0,
            pt.x,
            pt.y,
            trimWidthPx,
            trimHeightPx,
            (canvasTool === "shape" || canvasTool === "image") && ev.shiftKey
          )
          const minW =
            canvasTool === "text" ? MIN_PLACE_TEXT_W : MIN_PLACE_SHAPE_W
          const minH =
            canvasTool === "text" ? MIN_PLACE_TEXT_H : MIN_PLACE_SHAPE_H
          const w = Math.max(minW, r.w)
          const h = Math.max(minH, r.h)
          if (canvasTool === "text") {
            if (dragSnapGuides) {
              const s = snapTextLayerBoxTrimPx(
                r.x,
                r.y,
                w,
                h,
                dragSnapGuides.xs,
                dragSnapGuides.ys,
                SNAP_THRESHOLD_TRIM_PX,
                trimWidthPx,
                trimHeightPx
              )
              onPlaceText(s.x, s.y, w, h)
            } else {
              onPlaceText(r.x, r.y, w, h)
            }
          } else if (canvasTool === "image") {
            onPlaceImage(r.x, r.y, w, h)
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
      canvasTool,
      displayScale,
      isPlacementTool,
      onPlaceImage,
      onPlaceShape,
      onPlaceText,
      shapeVariant,
      dragSnapGuides,
      trimHeightPx,
      trimWidthPx,
    ]
  )

  const handleActiveSnapGuidesChange = useCallback(
    (guides: ActiveSnapGuideLines | null) => {
      setActiveSmartGuides(guides)
    },
    []
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
        canvasTool === "text" ||
          canvasTool === "shape" ||
          canvasTool === "image"
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
          return
        }

        if (isPageSelected && onDismissFrameSettings) {
          onDismissFrameSettings()
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
      <SmartGuidesOverlay
        guides={activeSmartGuides}
        displayScale={displayScale}
        trimWidthPx={trimWidthPx}
        trimHeightPx={trimHeightPx}
        bleedDisplay={bleedDisplay}
      />
      {placementPreview && isPlacementTool ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[14] border border-dashed border-[#7c3aed]"
          style={{
            left: placementPreview.x * displayScale,
            top: placementPreview.y * displayScale,
            width: Math.max(1, placementPreview.w * displayScale),
            height: Math.max(1, placementPreview.h * displayScale),
          }}
        />
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
                snapGuideXs={dragSnapGuides.xs}
                snapGuideYs={dragSnapGuides.ys}
                onActiveSnapGuidesChange={handleActiveSnapGuidesChange}
                isSelected={selectedElementId === layer.id}
                zIndex={z}
                getFrameElement={getFrameElement}
                onUpdate={(patch) => onUpdateShapeLayer(layer.id, patch)}
                onSelect={() => onSelectShapeLayer(layer.id)}
              />
            )
          }

          if (layer.kind === "image") {
            if (!resolveImageLayerVisible(layer)) {
              return null
            }

            return (
              <ImageLayerBox
                key={layer.id}
                layer={layer}
                displayScale={displayScale}
                trimWidthPx={trimWidthPx}
                trimHeightPx={trimHeightPx}
                snapGuideXs={dragSnapGuides.xs}
                snapGuideYs={dragSnapGuides.ys}
                onActiveSnapGuidesChange={handleActiveSnapGuidesChange}
                isSelected={selectedElementId === layer.id}
                zIndex={z}
                getFrameElement={getFrameElement}
                onUpdate={(patch) => onUpdateImageLayer(layer.id, patch)}
                onSelect={() => onSelectImageLayer(layer.id)}
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
              snapGuideXs={dragSnapGuides.xs}
              snapGuideYs={dragSnapGuides.ys}
              onActiveSnapGuidesChange={handleActiveSnapGuidesChange}
              isSelected={selectedElementId === layer.id}
              zIndex={z}
              getFrameElement={getFrameElement}
              textLayerIdToBeginTyping={textLayerIdToBeginTyping}
              onTextLayerBeginTypingHandled={onTextLayerBeginTypingHandled}
              onUpdate={(patch) => onUpdateTextLayer(layer.id, patch)}
              onSelect={() => onSelectTextLayer(layer.id)}
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
