import { useEffect, useRef } from "react"

import { CanvasStage } from "@/features/designer/components/layout/canvas-stage"
import { FrameNameField } from "@/features/designer/components/layout/page-controls"
import { useStageFit } from "@/features/designer/hooks/use-stage-fit"
import { useStagePan } from "@/features/designer/hooks/use-stage-pan"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import type { DesignerFrame } from "@/features/designer/model/frames"
import {
  ZOOM_WHEEL_SENSITIVITY,
  type ZoomMode,
} from "@/features/designer/model/ui-types"
import { cn } from "@workspace/ui/lib/utils"

type CanvasViewportProps = {
  activeFrame: DesignerFrame
  frameName: string
  onFrameNameChange: (name: string) => void
  getCanvasRef: (frameId: string) => (node: HTMLCanvasElement | null) => void
  displayScale: number
  zoomMode: ZoomMode
  onFitScaleChange: (scale: number) => void
  onZoomScaleChange: (scale: number) => void
  onSelectFrame: (frameId: string) => void
  toolbarChromeRef: React.RefObject<HTMLElement | null>
  bottomChromeRef: React.RefObject<HTMLElement | null>
}

export function CanvasViewport({
  activeFrame,
  frameName,
  onFrameNameChange,
  getCanvasRef,
  displayScale,
  zoomMode,
  onFitScaleChange,
  onZoomScaleChange,
  onSelectFrame,
  toolbarChromeRef,
  bottomChromeRef,
}: CanvasViewportProps) {
  const displayScaleRef = useRef(displayScale)
  const { exportWidthPx, exportHeightPx } = getExportDimensions(
    activeFrame.settings
  )
  const { viewportRef, stageRef, safeAreaInset } = useStageFit({
    contentWidthPx: exportWidthPx,
    contentHeightPx: exportHeightPx,
    onFitScaleChange,
    toolbarChromeRef,
    bottomChromeRef,
  })

  const isFitZoom = zoomMode === "fit"
  const {
    pan,
    isDragging,
    canPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useStagePan({
    enabled: !isFitZoom,
    resetKey: `${activeFrame.id}:${isFitZoom ? "fit" : "manual"}`,
  })

  useEffect(() => {
    displayScaleRef.current = displayScale
  }, [displayScale])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()

      const factor = Math.exp(-event.deltaY * ZOOM_WHEEL_SENSITIVITY)
      onZoomScaleChange(displayScaleRef.current * factor)
    }

    viewport.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      viewport.removeEventListener("wheel", onWheel)
    }
  }, [onZoomScaleChange, viewportRef])

  return (
    <div
      ref={viewportRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-stage-canvas"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSelectFrame(activeFrame.id)
        }
      }}
    >
      <div
        ref={stageRef}
        className={cn(
          "absolute inset-0 touch-none overflow-hidden overscroll-none bg-transparent",
          canPan && (isDragging ? "cursor-grabbing" : "cursor-grab")
        )}
        style={{ padding: safeAreaInset }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="group/frame flex flex-col items-start gap-3"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <div className="flex max-w-full items-center gap-1 self-stretch">
              <FrameNameField
                pageName={frameName}
                onPageNameChange={onFrameNameChange}
                className="min-w-0 flex-1"
              />
            </div>
            <CanvasStage
              settings={activeFrame.settings}
              registerCanvas={getCanvasRef(activeFrame.id)}
              displayScale={displayScale}
              isPageSelected
              onSelectPage={() => onSelectFrame(activeFrame.id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
