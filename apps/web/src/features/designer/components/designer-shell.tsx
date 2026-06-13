import { useCallback, useEffect, useRef } from "react"

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

  const getCanvasForFrame = useCallback((frameId: string) => {
    return canvasRefs.current.get(frameId) ?? null
  }, [])

  useFrameNameSync({
    settings: frames.settings,
    frameNameSource: frames.frameNameSource,
    setFrameNameFromPreset: frames.setFrameNameFromPreset,
    syncFrameNameFromSettings: frames.syncFrameNameFromSettings,
  })

  useEffect(() => {
    if (
      ui.selection.kind === "page" &&
      ui.selection.pageId !== frames.activeFrameId
    ) {
      ui.selectPage(frames.activeFrameId)
    }
  }, [frames.activeFrameId, ui.selection, ui.selectPage])

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <div className="flex h-full min-h-0">
        <MainStage
          ui={ui}
          frames={frames}
          layers={layers.layers}
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
          onDuplicateFrame={() => {
            const frameId = frames.duplicateFrame(frames.activeFrameId)
            ui.selectPage(frameId)
          }}
          onRemoveFrame={(frameId) => {
            layers.removeLayersForFrame(frameId)
            const nextActiveId = frames.removeFrame(frameId)
            ui.selectPage(nextActiveId)
          }}
        />

        <ContextPanel
          ui={ui}
          frames={frames}
          getCanvasForFrame={getCanvasForFrame}
          onImageUpload={frames.setBackgroundImage}
          layers={layers.layers}
          activeFrameId={frames.activeFrameId}
          onReorderLayers={layers.reorderLayers}
        />
      </div>
    </div>
  )
}
