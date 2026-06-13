import { useEffect, useRef } from "react"

import {
  AddPageButton,
  PageNameField,
} from "@/features/designer/components/layout/page-controls"
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
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  displayScale: number
  isPageSelected: boolean
  onSelectPage: () => void
}

export function CanvasStage({
  settings,
  canvasRef,
  displayScale,
  isPageSelected,
  onSelectPage,
}: CanvasStageProps) {
  const exportDimensions = getExportDimensions(settings)
  const previewGeometry = getPreviewGuideGeometry(settings)
  const { exportWidthPx, exportHeightPx } = exportDimensions
  const exportDisplayWidth = exportWidthPx * displayScale
  const exportDisplayHeight = exportHeightPx * displayScale
  const bleedDisplay = previewGeometry.bleedPx * displayScale
  const trimDisplayWidth = previewGeometry.trim.width * displayScale
  const trimDisplayHeight = previewGeometry.trim.height * displayScale

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
  }, [canvasRef, exportHeightPx, exportWidthPx, settings.background])

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
      aria-label="Select page"
    >
      <canvas
        ref={canvasRef}
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

type CanvasViewportProps = {
  settings: CanvasSettings
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  displayScale: number
  onFitScaleChange: (scale: number) => void
  isPageSelected: boolean
  onSelectPage: () => void
  pageName: string
  onPageNameChange: (name: string) => void
}

export function CanvasViewport({
  settings,
  canvasRef,
  displayScale,
  onFitScaleChange,
  isPageSelected,
  onSelectPage,
  pageName,
  onPageNameChange,
}: CanvasViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const exportDimensions = getExportDimensions(settings)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    function updateFitScale() {
      const bounds = viewport?.getBoundingClientRect()
      if (!bounds) {
        return
      }

      const paddingX = 64
      const paddingY = 120
      const availableWidth = Math.max(bounds.width - paddingX, 1)
      const availableHeight = Math.max(bounds.height - paddingY, 1)
      const scale = Math.min(
        availableWidth / exportDimensions.exportWidthPx,
        availableHeight / exportDimensions.exportHeightPx
      )

      onFitScaleChange(scale)
    }

    updateFitScale()

    const observer = new ResizeObserver(updateFitScale)
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [
    exportDimensions.exportHeightPx,
    exportDimensions.exportWidthPx,
    onFitScaleChange,
  ])

  return (
    <div
      ref={viewportRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-muted/30"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSelectPage()
        }
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <PageNameField
            pageName={pageName}
            onPageNameChange={onPageNameChange}
          />
          <CanvasStage
            settings={settings}
            canvasRef={canvasRef}
            displayScale={displayScale}
            isPageSelected={isPageSelected}
            onSelectPage={onSelectPage}
          />
          <AddPageButton />
        </div>
      </div>
    </div>
  )
}
