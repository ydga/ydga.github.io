import { useCallback, useEffect, useRef, useState } from "react"

import { ContextPanel } from "@/features/designer/components/layout/context-panel"
import { MainStage } from "@/features/designer/components/layout/main-stage"
import { useDesignerFrames } from "@/features/designer/state/use-designer-frames"
import { useDesignerLayers } from "@/features/designer/state/use-designer-layers"
import { useDesignerUi } from "@/features/designer/state/use-designer-ui"
import { useFrameNameSync } from "@/features/designer/state/use-page-name-sync"

function shouldLetFieldHandleDeleteKey(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (
    target instanceof HTMLTextAreaElement &&
    target.dataset.designerTextEditing === "true"
  ) {
    return true
  }

  if (target instanceof HTMLInputElement) {
    const t = target.type
    return !(
      t === "button" ||
      t === "submit" ||
      t === "checkbox" ||
      t === "radio" ||
      t === "range" ||
      t === "file" ||
      t === "hidden"
    )
  }

  return target.getAttribute("contenteditable") === "true"
}

export function DesignerShell() {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement | null>())
  const frames = useDesignerFrames()
  const layers = useDesignerLayers()
  const ui = useDesignerUi()
  const [textLayerIdToBeginTyping, setTextLayerIdToBeginTyping] = useState<
    string | null
  >(null)

  const clearTextLayerBeginTyping = useCallback(() => {
    setTextLayerIdToBeginTyping(null)
  }, [])
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

  useEffect(() => {
    if (ui.canvasTool !== "text") {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        ui.setCanvasTool("select")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [ui.canvasTool, ui.setCanvasTool])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return
      }

      if (ui.selection.kind !== "element") {
        return
      }

      if (shouldLetFieldHandleDeleteKey(event.target)) {
        return
      }

      event.preventDefault()

      const { pageId, elementId } = ui.selection
      layers.removeLayer(elementId)
      ui.selectPage(pageId)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [layers.removeLayer, ui.selection, ui.selectPage])

  const handlePlaceText = useCallback(
    (trimX: number, trimY: number, trimWidth?: number, trimHeight?: number) => {
      const id = layers.addTextLayer({
        frameId: frames.activeFrameId,
        x: trimX,
        y: trimY,
        width: trimWidth,
        height: trimHeight,
      })
      ui.selectElement(frames.activeFrameId, id)
      setTextLayerIdToBeginTyping(id)
      queueMicrotask(() => {
        ui.setCanvasTool("select")
      })
    },
    [frames.activeFrameId, layers, ui]
  )

  const handleSelectTextLayer = useCallback(
    (layerId: string) => {
      ui.selectElement(frames.activeFrameId, layerId)
    },
    [frames.activeFrameId, ui]
  )

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <div className="flex h-full min-h-0 pt-2 pb-2 pl-2">
        <MainStage
          ui={ui}
          frames={frames}
          layers={layers.layers}
          textLayerIdToBeginTyping={textLayerIdToBeginTyping}
          onTextLayerBeginTypingHandled={clearTextLayerBeginTyping}
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
          onPlaceText={handlePlaceText}
          onUpdateTextLayer={layers.updateTextLayer}
          onSelectTextLayer={handleSelectTextLayer}
        />

        <ContextPanel
          ui={ui}
          frames={frames}
          getCanvasForFrame={getCanvasForFrame}
          onImageUpload={frames.setBackgroundImage}
          layers={layers.layers}
          activeFrameId={frames.activeFrameId}
          onReorderLayers={layers.reorderLayers}
          onUpdateTextLayer={layers.updateTextLayer}
        />
      </div>
    </div>
  )
}
