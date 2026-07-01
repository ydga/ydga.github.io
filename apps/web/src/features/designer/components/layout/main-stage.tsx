import { useMemo, useRef } from "react"

import { BottomStageBar } from "@/features/designer/components/layout/bottom-stage-bar"
import { CanvasViewport } from "@/features/designer/components/layout/canvas-viewport"
import { CanvasToolbar } from "@/features/designer/components/layout/canvas-toolbar"
import { FloatingChrome } from "@/features/designer/components/layout/floating-chrome"
import { frameHasElements } from "@/features/designer/model/frames"
import { getLayersForFrame } from "@/features/designer/model/layers"
import type {
  Layer,
  ShapeLayerUpdatePatch,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import type { DesignerFrames } from "@/features/designer/state/use-designer-frames"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"

type MainStageProps = {
  ui: DesignerUi
  frames: DesignerFrames
  layers: Layer[]
  getCanvasRef: (frameId: string) => (node: HTMLCanvasElement | null) => void
  onSelectFrame: (frameId: string) => void
  onAddFrame: () => string
  onDuplicateFrame: () => void
  onRemoveFrame: (frameId: string) => void
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
  onSelectTextLayer: (layerId: string) => void
  onSelectShapeLayer: (layerId: string) => void
  textLayerIdToBeginTyping: string | null
  onTextLayerBeginTypingHandled: () => void
}

export function MainStage({
  ui,
  frames,
  layers,
  getCanvasRef,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onRemoveFrame,
  onPlaceText,
  onPlaceShape,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onSelectTextLayer,
  onSelectShapeLayer,
  textLayerIdToBeginTyping,
  onTextLayerBeginTypingHandled,
}: MainStageProps) {
  const toolbarChromeRef = useRef<HTMLDivElement>(null)
  const bottomChromeRef = useRef<HTMLDivElement>(null)

  const activeFrame =
    frames.frames.find((frame) => frame.id === frames.activeFrameId) ??
    frames.frames[0]!

  const activeFrameLayers = useMemo(() => {
    return getLayersForFrame(layers, activeFrame.id)
  }, [layers, activeFrame.id])

  const activeFrameTextLayers = useMemo(() => {
    return activeFrameLayers.filter((layer) => layer.kind === "text")
  }, [activeFrameLayers])

  function handleCanvasPageSelect(frameId: string) {
    onSelectFrame(frameId)
    ui.selectPageAndOpen(frameId)
  }

  function handleFrameTabSelect(frameId: string) {
    onSelectFrame(frameId)
    ui.selectPageAndOpen(frameId)
  }

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] bg-stage-canvas">
      <FloatingChrome
        position="top-right"
        variant="frosted"
        fitChromeRef={toolbarChromeRef}
        innerClassName="overflow-visible"
      >
        <CanvasToolbar ui={ui} />
      </FloatingChrome>

      <CanvasViewport
        activeFrame={activeFrame}
        frameName={frames.frameName}
        onFrameNameChange={frames.setFrameName}
        getCanvasRef={getCanvasRef}
        displayScale={ui.effectiveScale}
        zoomMode={ui.zoomMode}
        onFitScaleChange={ui.setFitScale}
        onZoomScaleChange={ui.setZoomScale}
        onSelectFrame={handleCanvasPageSelect}
        onDeselectFrameElement={(frameId) => ui.selectPage(frameId)}
        onDismissFrameSettings={ui.dismissFrameSettings}
        dispatch={frames.dispatch}
        toolbarChromeRef={toolbarChromeRef}
        bottomChromeRef={bottomChromeRef}
        canvasTool={ui.canvasTool}
        shapeVariant={ui.shapeVariant}
        selection={ui.selection}
        frameEngagedId={ui.frameEngagedId}
        frameLayers={activeFrameLayers}
        textLayers={activeFrameTextLayers}
        onPlaceText={onPlaceText}
        onPlaceShape={onPlaceShape}
        onUpdateTextLayer={onUpdateTextLayer}
        onUpdateShapeLayer={onUpdateShapeLayer}
        onSelectTextLayer={onSelectTextLayer}
        onSelectShapeLayer={onSelectShapeLayer}
        textLayerIdToBeginTyping={textLayerIdToBeginTyping}
        onTextLayerBeginTypingHandled={onTextLayerBeginTypingHandled}
      />

      <BottomStageBar
        fitChromeRef={bottomChromeRef}
        frames={frames.frames}
        activeFrameId={frames.activeFrameId}
        effectiveScale={ui.effectiveScale}
        zoomMode={ui.zoomMode}
        onSelectFrame={handleFrameTabSelect}
        onAddFrame={onAddFrame}
        onDuplicateFrame={onDuplicateFrame}
        onRemovePage={() => onRemoveFrame(frames.activeFrameId)}
        canRemovePage={frames.frames.length > 1}
        hasPageElements={frameHasElements(activeFrame, layers)}
        activeFrameName={frames.frameName}
        onZoomScaleChange={ui.setZoomScale}
        onZoomFit={ui.zoomFit}
      />
    </main>
  )
}
