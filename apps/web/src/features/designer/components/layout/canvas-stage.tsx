import { useCallback, useEffect, useRef } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import type { CanvasSettings } from "@/features/designer/model/types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"
import {
  getBackgroundFallbackColor,
  renderPreviewCanvasBackground,
  renderTrimPreviewBackground,
  shouldShowBleedPreview,
} from "@/features/designer/lib/render-background"
import { cn } from "@workspace/ui/lib/utils"

type CanvasStageProps = {
  settings: CanvasSettings
  registerCanvas?: (node: HTMLCanvasElement | null) => void
  displayScale: number
  isPageSelected: boolean
  onSelectPage: () => void
}

export function CanvasStage({
  settings,
  registerCanvas,
  displayScale,
  isPageSelected,
  onSelectPage,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
        context.fillStyle = getBackgroundFallbackColor(settings.background)
        context.fillRect(0, 0, canvasWidthPx, canvasHeightPx)
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

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group/frame-chrome cursor-inherit relative block shrink-0 outline-none",
        showBleedPreview ? "overflow-visible" : "overflow-hidden"
      )}
      style={{ width: trimDisplayWidth, height: trimDisplayHeight }}
      onClick={onSelectPage}
      onKeyDown={(event) => {
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
    </div>
  )
}
