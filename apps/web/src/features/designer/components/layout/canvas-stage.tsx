import { useCallback, useEffect, useRef, useState } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import { GradientCanvasOverlay } from "@/features/designer/components/preview/gradient-canvas-overlay"
import type {
  CanvasSettings,
  GradientStop,
} from "@/features/designer/model/types"
import type { CanvasTool, Selection } from "@/features/designer/model/ui-types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
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

type CanvasStageProps = {
  settings: CanvasSettings
  registerCanvas?: (node: HTMLCanvasElement | null) => void
  displayScale: number
  isPageSelected: boolean
  onSelectPage: () => void
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
}

export function CanvasStage({
  settings,
  registerCanvas,
  displayScale,
  isPageSelected,
  onSelectPage,
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
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const textAreaRefs = useRef(new Map<string, HTMLTextAreaElement | null>())
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
        const pt = trimPointFromClient(
          host,
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

        const pt = trimPointFromClient(
          host,
          ev.clientX,
          ev.clientY,
          displayScale
        )
        const dx = Math.abs(pt.x - session.x0)
        const dy = Math.abs(pt.y - session.y0)

        if (dx < TEXT_PLACE_TAP_TRIM_PX && dy < TEXT_PLACE_TAP_TRIM_PX) {
          onPlaceText(session.x0, session.y0)
        } else {
          const r = clampPlacementRect(
            session.x0,
            session.y0,
            pt.x,
            pt.y,
            trimWidthPx,
            trimHeightPx
          )
          onPlaceText(
            r.x,
            r.y,
            Math.max(MIN_PLACE_TEXT_W, r.w),
            Math.max(MIN_PLACE_TEXT_H, r.h)
          )
        }
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [canvasTool, displayScale, onPlaceText, trimHeightPx, trimWidthPx]
  )

  return (
    <div
      ref={frameRef}
      role="button"
      tabIndex={0}
      className={cn(
        "group/frame-chrome relative block shrink-0 outline-none",
        canvasTool === "text" ? "cursor-crosshair" : "cursor-inherit",
        showBleedPreview ? "overflow-visible" : "overflow-hidden"
      )}
      style={{ width: trimDisplayWidth, height: trimDisplayHeight }}
      onPointerDown={handleFramePointerDown}
      onClick={() => {
        if (canvasTool !== "text") {
          onSelectPage()
        }
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
      aria-label="Select frame"
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
          "pointer-events-none absolute inset-0 shadow-lg ring-1 transition-shadow",
          isPageSelected
            ? "ring-2 ring-primary/40"
            : "ring-foreground/10 group-hover/frame-chrome:ring-foreground/20"
        )}
      />
      <GuidesOverlay settings={settings} displayScale={displayScale} />
      {placementPreview && canvasTool === "text" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[14] border-2 border-dashed border-[#7c3aed]"
          style={{
            left: placementPreview.x * displayScale,
            top: placementPreview.y * displayScale,
            width: Math.max(1, placementPreview.w * displayScale),
            height: Math.max(1, placementPreview.h * displayScale),
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[15]">
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
              isSelected={isSelected}
              zIndex={z}
              getFrameElement={getFrameElement}
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
