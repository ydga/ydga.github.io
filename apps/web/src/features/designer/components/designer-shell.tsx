import { useCallback, useRef } from "react"

import { ContextPanel } from "@/features/designer/components/layout/context-panel"
import { MainStage } from "@/features/designer/components/layout/main-stage"
import { useDesignerFrames } from "@/features/designer/state/use-designer-frames"
import { useDesignerLayers } from "@/features/designer/state/use-designer-layers"
import { useDesignerUi } from "@/features/designer/state/use-designer-ui"
import { useFrameNameSync } from "@/features/designer/state/use-page-name-sync"

export function DesignerShell() {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement | null>())
  const frames = useDesignerFrames()
  const layers = useDesignerLayers()
  const ui = useDesignerUi()

  const getCanvasRef = useCallback(
    (frameId: string) => (node: HTMLCanvasElement | null) => {
      if (node) {
        canvasRefs.current.set(frameId, node)
        return
      }

      canvasRefs.current.delete(frameId)
    },
    []
  )

  const getActiveCanvas = useCallback(() => {
    return canvasRefs.current.get(frames.activeFrameId) ?? null
  }, [frames.activeFrameId])

  useFrameNameSync({
    settings: frames.settings,
    frameNameSource: frames.frameNameSource,
    setFrameNameFromPreset: frames.setFrameNameFromPreset,
    syncFrameNameFromSettings: frames.syncFrameNameFromSettings,
  })

  const handleRemoveFrame = useCallback(
    (frameId: string) => {
      layers.removeLayersForFrame(frameId)
      const nextActiveId = frames.removeFrame(frameId)
      ui.selectPage(nextActiveId)
    },
    [frames, layers, ui]
  )

  const handleDuplicateFrame = useCallback(
    (frameId: string) => {
      const newFrameId = frames.duplicateFrame(frameId)
      ui.selectPage(newFrameId)
      return newFrameId
    },
    [frames, ui]
  )

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <div className="flex h-full min-h-0">
        <MainStage
          ui={ui}
          frames={frames}
          layers={layers}
          getCanvasRef={getCanvasRef}
          onSelectFrame={(frameId) => {
            frames.selectFrame(frameId)
            ui.selectPage(frameId)
          }}
          onAddFrame={() => {
            const frameId = frames.addFrame()
            ui.selectPage(frameId)
            return frameId
          }}
          onRemoveFrame={handleRemoveFrame}
          onDuplicateFrame={handleDuplicateFrame}
          onMoveFrame={frames.moveFrame}
        />

        <ContextPanel
          ui={ui}
          frames={frames}
          getActiveCanvas={getActiveCanvas}
          onImageUpload={frames.setBackgroundImage}
          layers={layers.layers}
          activeFrameId={frames.activeFrameId}
          onReorderLayers={layers.reorderLayers}
        />
      </div>
    </div>
  )
}
