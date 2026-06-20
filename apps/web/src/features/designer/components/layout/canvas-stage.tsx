import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import { GradientCanvasOverlay } from "@/features/designer/components/preview/gradient-canvas-overlay"
import type {
  CanvasSettings,
  GradientStop,
} from "@/features/designer/model/types"
import type { CanvasTool, Selection } from "@/features/designer/model/ui-types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import {
  SNAP_THRESHOLD_TRIM_PX,
  buildSnapGuideLinesTrimPx,
  guideSnapActiveForText,
  snapTextLayerBoxTrimPx,
} from "@/features/designer/lib/guide-snap"
import { normalizeBackgroundGradient } from "@/features/designer/lib/gradient-stops"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"
import {
  paintBackgroundFallback,
  renderPreviewCanvasBackground,
  renderTrimPreviewBackground,
  shouldShowBleedPreview,
} from "@/features/designer/lib/render-background"
import { TextLayerBox } from "@/features/designer/components/layout/text-layer-box"
import type {
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { cn } from "@workspace/ui/lib/utils"

const MIN_PLACE_TEXT_W = 48
const MIN_PLACE_TEXT_H = 36
const TEXT_PLACE_TAP_TRIM_PX = 4
/** Defaults for tap-to-place text; keep aligned with `useDesignerLayers` `addTextLayer`. */
const DEFAULT_NEW_TEXT_W_TRIM = 200
const DEFAULT_NEW_TEXT_H_TRIM = 72

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

function isNonElementFrameTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest("[data-designer-text-box]")) {
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
  selection: Selection
  textLayers: TextLayer[]
  onPlaceText: (
    trimX: number,
    trimY: number,
    trimWidth?: number,
    trimHeight?: number
  ) => void
  onUpdateTextLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onSelectTextLayer: (layerId: string) => void
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
  selection,
  textLayers,
  onPlaceText,
  onUpdateTextLayer,
  onSelectTextLayer,
  textLayerIdToBeginTyping,
  onTextLayerBeginTypingHandled,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const textAreaRefs = useRef(new Map<string, HTMLTextAreaElement | null>())
  /** Clicks that immediately follow text placement would otherwise bubble here and clear the new text selection. */
  const suppressFrameClickAfterTextPlaceRef = useRef(false)
  const suppressFrameClickTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const placementSessionRef = useRef<PlacementSession | null>(null)
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

  function armSuppressFrameClickAfterTextPlace() {
    suppressFrameClickAfterTextPlaceRef.current = true
    if (suppressFrameClickTimerRef.current != null) {
      clearTimeout(suppressFrameClickTimerRef.current)
    }
    suppressFrameClickTimerRef.current = setTimeout(() => {
      suppressFrameClickTimerRef.current = null
      suppressFrameClickAfterTextPlaceRef.current = false
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

  const selectedTextId =
    selection.kind === "element" &&
    selection.pageId === frameId &&
    textLayers.some((layer) => layer.id === selection.elementId)
      ? selection.elementId
      : null

  const getFrameElement = useCallback(() => frameRef.current, [])

  const handleFramePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (canvasTool !== "text" || event.button !== 0) {
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
        const r = clampPlacementRect(
          session.x0,
          session.y0,
          pt.x,
          pt.y,
          trimWidthPx,
          trimHeightPx
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
          const r = clampPlacementRect(
            session.x0,
            session.y0,
            pt.x,
            pt.y,
            trimWidthPx,
            trimHeightPx
          )
          const w = Math.max(MIN_PLACE_TEXT_W, r.w)
          const h = Math.max(MIN_PLACE_TEXT_H, r.h)
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
        }
        armSuppressFrameClickAfterTextPlace()
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [
      canvasTool,
      displayScale,
      onPlaceText,
      snapGuides,
      trimHeightPx,
      trimWidthPx,
    ]
  )

  return (
    <div
      ref={frameRef}
      data-designer-canvas-frame
      role="button"
      tabIndex={0}
      className={cn(
        "group/frame-chrome relative block shrink-0 outline-none",
        canvasTool === "text" ? "cursor-crosshair" : "cursor-inherit",
        showBleedPreview || anyTextLayerAllowsPaintOverflow
          ? "overflow-visible"
          : "overflow-hidden"
      )}
      style={{ width: trimDisplayWidth, height: trimDisplayHeight }}
      onPointerDown={handleFramePointerDown}
      onClick={(event) => {
        if (suppressFrameClickAfterTextPlaceRef.current) {
          suppressFrameClickAfterTextPlaceRef.current = false
          if (suppressFrameClickTimerRef.current != null) {
            clearTimeout(suppressFrameClickTimerRef.current)
            suppressFrameClickTimerRef.current = null
          }
          event.preventDefault()
          event.stopPropagation()
          return
        }

        if (canvasTool === "text") {
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
        if (suppressFrameClickAfterTextPlaceRef.current) {
          suppressFrameClickAfterTextPlaceRef.current = false
          if (suppressFrameClickTimerRef.current != null) {
            clearTimeout(suppressFrameClickTimerRef.current)
            suppressFrameClickTimerRef.current = null
          }
          event.preventDefault()
          event.stopPropagation()
          return
        }

        if (canvasTool === "text") {
          return
        }

        if (!isNonElementFrameTarget(event.target)) {
          return
        }

        onSelectPage()
      }}
      onKeyDown={(event) => {
        if (canvasTool === "text") {
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
      {placementPreview && canvasTool === "text" ? (
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
        {textLayers.map((layer, index) => {
          const isSelected = selectedTextId === layer.id
          const z = 10 + (textLayers.length - index)

          return (
            <TextLayerBox
              key={layer.id}
              layer={layer}
              displayScale={displayScale}
              trimWidthPx={trimWidthPx}
              trimHeightPx={trimHeightPx}
              snapGuideXs={snapGuides?.xs ?? null}
              snapGuideYs={snapGuides?.ys ?? null}
              isSelected={isSelected}
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
