import { useEffect, useRef } from "react"

import { CanvasStage } from "@/features/designer/components/layout/canvas-stage"
import { FrameNameField } from "@/features/designer/components/layout/page-controls"
import { useStageFit } from "@/features/designer/hooks/use-stage-fit"
import { useStagePan } from "@/features/designer/hooks/use-stage-pan"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import { shouldShowBleedPreview } from "@/features/designer/lib/render-background"
import { frameAllowsElementOverflow } from "@/features/designer/lib/frame-content"
import type { DesignerFrame } from "@/features/designer/model/frames"
import type {
  ImageLayerUpdatePatch,
  Layer,
  ShapeLayerUpdatePatch,
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  ZOOM_WHEEL_SENSITIVITY,
  type CanvasTool,
  type Selection,
  type ShapeVariant,
  type ZoomMode,
} from "@/features/designer/model/ui-types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
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
  onDeselectFrameElement: (frameId: string) => void
  onDismissFrameSettings: () => void
  dispatch: DesignerDispatch
  toolbarChromeRef: React.RefObject<HTMLElement | null>
  bottomChromeRef: React.RefObject<HTMLElement | null>
  canvasTool: CanvasTool
  shapeVariant: ShapeVariant
  selection: Selection
  frameEngagedId: string | null
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
  onUpdateTextLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onUpdateImageLayer: (layerId: string, patch: ImageLayerUpdatePatch) => void
  onSelectTextLayer: (layerId: string) => void
  onSelectShapeLayer: (layerId: string) => void
  onSelectImageLayer: (layerId: string) => void
  textLayerIdToBeginTyping: string | null
  onTextLayerBeginTypingHandled: () => void
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
  onDeselectFrameElement,
  onDismissFrameSettings,
  dispatch,
  toolbarChromeRef,
  bottomChromeRef,
  canvasTool,
  shapeVariant,
  selection,
  frameEngagedId,
  frameLayers,
  textLayers,
  onPlaceText,
  onPlaceShape,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onUpdateImageLayer,
  onSelectTextLayer,
  onSelectShapeLayer,
  onSelectImageLayer,
  textLayerIdToBeginTyping,
  onTextLayerBeginTypingHandled,
}: CanvasViewportProps) {
  const displayScaleRef = useRef(displayScale)
  const exportDimensions = getExportDimensions(activeFrame.settings)
  const showBleedPreview = shouldShowBleedPreview(activeFrame.settings)
  const allowElementOverflow = frameAllowsElementOverflow(
    activeFrame.settings,
    showBleedPreview
  )
  const contentWidthPx = showBleedPreview
    ? exportDimensions.exportWidthPx
    : exportDimensions.trimWidthPx
  const contentHeightPx = showBleedPreview
    ? exportDimensions.exportHeightPx
    : exportDimensions.trimHeightPx
  const { viewportRef, stageRef, safeAreaInset } = useStageFit({
    contentWidthPx,
    contentHeightPx,
    onFitScaleChange,
    toolbarChromeRef,
    bottomChromeRef,
  })

  const isFitZoom = zoomMode === "fit"
  const canPanCanvas =
    !isFitZoom && canvasTool !== "text" && canvasTool !== "shape"
  const {
    pan,
    isDragging,
    addPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useStagePan({
    enabled: canPanCanvas,
    resetKey: `${activeFrame.id}:${isFitZoom ? "fit" : "manual"}`,
  })

  useEffect(() => {
    displayScaleRef.current = displayScale
  }, [displayScale])

  const addPanRef = useRef(addPan)
  useEffect(() => {
    addPanRef.current = addPan
  }, [addPan])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()

      const isZoomGesture = event.ctrlKey || event.metaKey
      const isTrackpadScroll =
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ||
        Math.abs(event.deltaX) > 0

      if (!isZoomGesture && isTrackpadScroll && canPanCanvas) {
        addPanRef.current(-event.deltaX, -event.deltaY)
        return
      }

      const factor = Math.exp(-event.deltaY * ZOOM_WHEEL_SENSITIVITY)
      onZoomScaleChange(displayScaleRef.current * factor)
    }

    // Capture so `preventDefault` runs before a focused `<textarea>` applies
    // its default wheel scroll (which would steal zoom / feel like “scrolling the text box”).
    viewport.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    })

    return () => {
      viewport.removeEventListener("wheel", onWheel, { capture: true })
    }
  }, [canPanCanvas, onZoomScaleChange, viewportRef])

  function handleStageClick(event: React.MouseEvent) {
    if (canvasTool === "text" || canvasTool === "shape") {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest("[data-designer-frame-cluster]")) {
      return
    }

    if (selection.kind === "element") {
      onDeselectFrameElement(activeFrame.id)
      return
    }

    if (frameEngagedId === activeFrame.id) {
      onDismissFrameSettings()
    }
  }

  return (
    <div
      ref={viewportRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-stage-canvas"
    >
      <div
        ref={stageRef}
        className={cn(
          "absolute inset-0 touch-none overscroll-none bg-transparent",
          allowElementOverflow ? "overflow-visible" : "overflow-hidden",
          canPanCanvas &&
            (isDragging ? "cursor-grabbing" : "cursor-grab")
        )}
        style={{ padding: safeAreaInset }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={handleStageClick}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            data-designer-frame-cluster
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
              isPageSelected={frameEngagedId === activeFrame.id}
              onSelectPage={() => onSelectFrame(activeFrame.id)}
              onDeselectElement={() => onDeselectFrameElement(activeFrame.id)}
              onDismissFrameSettings={onDismissFrameSettings}
              onGradientStopsChange={(value) =>
                dispatch({ type: "set-background-gradient-stops", value })
              }
              onGradientStartChange={(x, y) =>
                dispatch({
                  type: "set-background-gradient-axis-start",
                  value: { x, y },
                })
              }
              onGradientEndChange={(x, y) =>
                dispatch({
                  type: "set-background-gradient-axis-end",
                  value: { x, y },
                })
              }
              frameId={activeFrame.id}
              canvasTool={canvasTool}
              shapeVariant={shapeVariant}
              selection={selection}
              frameLayers={frameLayers}
              textLayers={textLayers}
              onPlaceText={onPlaceText}
              onPlaceShape={onPlaceShape}
              onUpdateTextLayer={onUpdateTextLayer}
              onUpdateShapeLayer={onUpdateShapeLayer}
              onUpdateImageLayer={onUpdateImageLayer}
              onSelectTextLayer={onSelectTextLayer}
              onSelectShapeLayer={onSelectShapeLayer}
              onSelectImageLayer={onSelectImageLayer}
              textLayerIdToBeginTyping={textLayerIdToBeginTyping}
              onTextLayerBeginTypingHandled={onTextLayerBeginTypingHandled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
