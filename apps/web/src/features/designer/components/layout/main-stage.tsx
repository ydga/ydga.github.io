import { useRef } from "react"

import { BottomStageBar } from "@/features/designer/components/layout/bottom-stage-bar"
import { CanvasViewport } from "@/features/designer/components/layout/canvas-viewport"
import { CanvasToolbar } from "@/features/designer/components/layout/canvas-toolbar"
import { FloatingChrome } from "@/features/designer/components/layout/floating-chrome"
import { frameHasElements } from "@/features/designer/model/frames"
import type { Layer } from "@/features/designer/model/layers"
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
}: MainStageProps) {
  const toolbarChromeRef = useRef<HTMLDivElement>(null)
  const bottomChromeRef = useRef<HTMLDivElement>(null)

  const activeFrame =
    frames.frames.find((frame) => frame.id === frames.activeFrameId) ??
    frames.frames[0]!

  function handleSelectFrame(frameId: string) {
    onSelectFrame(frameId)
    ui.selectPageAndOpen(frameId)
  }

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <FloatingChrome
        position="top-right"
        variant="frosted"
        fitChromeRef={toolbarChromeRef}
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
        onSelectFrame={handleSelectFrame}
        dispatch={frames.dispatch}
        toolbarChromeRef={toolbarChromeRef}
        bottomChromeRef={bottomChromeRef}
      />

      <BottomStageBar
        fitChromeRef={bottomChromeRef}
        frames={frames.frames}
        activeFrameId={frames.activeFrameId}
        effectiveScale={ui.effectiveScale}
        zoomMode={ui.zoomMode}
        onSelectFrame={handleSelectFrame}
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
