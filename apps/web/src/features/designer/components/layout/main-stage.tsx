import { useRef } from "react"

import { CanvasViewport } from "@/features/designer/components/layout/canvas-viewport"
import { CanvasToolbar } from "@/features/designer/components/layout/canvas-toolbar"
import { FloatingChrome } from "@/features/designer/components/layout/floating-chrome"
import { ZoomControls } from "@/features/designer/components/layout/zoom-controls"
import type { DesignerFrames } from "@/features/designer/state/use-designer-frames"
import type { DesignerLayers } from "@/features/designer/state/use-designer-layers"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"

type MainStageProps = {
  ui: DesignerUi
  frames: DesignerFrames
  layers: DesignerLayers
  getCanvasRef: (frameId: string) => (node: HTMLCanvasElement | null) => void
  onSelectFrame: (frameId: string) => void
  onAddFrame: () => string
  onRemoveFrame: (frameId: string) => void
  onDuplicateFrame: (frameId: string) => string
  onMoveFrame: (frameId: string, direction: "up" | "down") => void
}

export function MainStage({
  ui,
  frames,
  layers,
  getCanvasRef,
  onSelectFrame,
  onAddFrame,
  onRemoveFrame,
  onDuplicateFrame,
  onMoveFrame,
}: MainStageProps) {
  const toolbarChromeRef = useRef<HTMLDivElement>(null)
  const zoomChromeRef = useRef<HTMLDivElement>(null)

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
        frames={frames.frames}
        activeFrameId={frames.activeFrameId}
        layers={layers.layers}
        getCanvasRef={getCanvasRef}
        displayScale={ui.effectiveScale}
        onFitScaleChange={ui.setFitScale}
        onZoomScaleChange={ui.setZoomScale}
        onSelectFrame={handleSelectFrame}
        onFrameNameChange={frames.setFrameName}
        onAddFrame={onAddFrame}
        onRemoveFrame={onRemoveFrame}
        onDuplicateFrame={onDuplicateFrame}
        onMoveFrame={onMoveFrame}
        toolbarChromeRef={toolbarChromeRef}
        zoomChromeRef={zoomChromeRef}
      />

      <FloatingChrome position="bottom-center" fitChromeRef={zoomChromeRef}>
        <ZoomControls
          effectiveScale={ui.effectiveScale}
          zoomMode={ui.zoomMode}
          onZoomScaleChange={ui.setZoomScale}
          onZoomFit={ui.zoomFit}
        />
      </FloatingChrome>
    </main>
  )
}
