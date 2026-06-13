import { useCallback, useEffect, useRef } from "react"

import { GuidesOverlay } from "@/features/designer/components/preview/guides-overlay"
import type { CanvasSettings } from "@/features/designer/model/types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"
import {
  getBackgroundFallbackColor,
  renderBackground,
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
  const { exportWidthPx, exportHeightPx } = exportDimensions
  const exportDisplayWidth = exportWidthPx * displayScale
  const exportDisplayHeight = exportHeightPx * displayScale
  const bleedDisplay = previewGeometry.bleedPx * displayScale
  const trimDisplayWidth = previewGeometry.trim.width * displayScale
  const trimDisplayHeight = previewGeometry.trim.height * displayScale

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

    canvas.width = exportWidthPx
    canvas.height = exportHeightPx

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    void renderBackground(
      context,
      exportWidthPx,
      exportHeightPx,
      settings.background
    ).catch(() => {
      if (!cancelled) {
        context.fillStyle = getBackgroundFallbackColor(settings.background)
        context.fillRect(0, 0, exportWidthPx, exportHeightPx)
      }
    })

    return () => {
      cancelled = true
    }
  }, [exportHeightPx, exportWidthPx, settings.background])

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "relative block shrink-0 cursor-default overflow-visible shadow-lg ring-1 transition-shadow outline-none",
        isPageSelected
          ? "ring-2 ring-primary/40"
          : "ring-foreground/10 hover:ring-foreground/20"
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
        className="absolute block bg-white"
        style={{
          left: -bleedDisplay,
          top: -bleedDisplay,
          width: exportDisplayWidth,
          height: exportDisplayHeight,
        }}
      />
      <GuidesOverlay settings={settings} displayScale={displayScale} />
    </div>
  )
}
