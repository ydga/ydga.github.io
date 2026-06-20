import { useCallback, useEffect, useRef, useState } from "react"

import { ContextPanel } from "@/features/designer/components/layout/context-panel"
import { MainStage } from "@/features/designer/components/layout/main-stage"
import {
  frameHasElements,
  syncCanvasToolForFrameElements,
} from "@/features/designer/model/frames"
import { useDesignerFrames } from "@/features/designer/state/use-designer-frames"
import { useDesignerLayers } from "@/features/designer/state/use-designer-layers"
import { useDesignerUi } from "@/features/designer/state/use-designer-ui"
import { useFrameNameSync } from "@/features/designer/state/use-page-name-sync"

function shouldLetFieldHandleDeleteKey(event: KeyboardEvent): boolean {
  const candidates = [event.target, document.activeElement]

  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLTextAreaElement)) {
      continue
    }

    if (!candidate.closest("[data-designer-text-box]")) {
      continue
    }

    if (candidate.dataset.designerTextEditing !== "true") {
      continue
    }

    // Empty while editing: let the shell remove the text layer on Delete/Backspace.
    if (candidate.value.length === 0) {
      return false
    }

    return true
  }

  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return false
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

  const activeFrame =
    frames.frames.find((frame) => frame.id === frames.activeFrameId) ??
    frames.frames[0]!

  const activeFrameHasElements = frameHasElements(activeFrame, layers.layers)

  const syncToolForActiveFrame = useCallback(() => {
    syncCanvasToolForFrameElements(activeFrameHasElements, {
      selectPointerTool: ui.selectPointerTool,
      selectTextTool: ui.selectTextTool,
    })
  }, [activeFrameHasElements, ui.selectPointerTool, ui.selectTextTool])

  const initialToolSyncedRef = useRef(false)
  const lastFrameIdRef = useRef(frames.activeFrameId)

  useEffect(() => {
    if (!initialToolSyncedRef.current) {
      initialToolSyncedRef.current = true
      syncToolForActiveFrame()
      lastFrameIdRef.current = frames.activeFrameId
      return
    }

    if (lastFrameIdRef.current === frames.activeFrameId) {
      return
    }

    lastFrameIdRef.current = frames.activeFrameId
    syncToolForActiveFrame()
  }, [frames.activeFrameId, syncToolForActiveFrame])

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
        ui.selectPointerTool()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [ui.canvasTool, ui.selectPointerTool])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return
      }

      if (ui.selection.kind !== "element") {
        return
      }

      if (shouldLetFieldHandleDeleteKey(event)) {
        return
      }

      event.preventDefault()

      const { pageId, elementId } = ui.selection
      const nextLayers = layers.layers.filter((layer) => layer.id !== elementId)
      const frame =
        frames.frames.find((item) => item.id === pageId) ?? activeFrame

      layers.removeLayer(elementId)
      ui.selectPage(pageId)

      syncCanvasToolForFrameElements(frameHasElements(frame, nextLayers), {
        selectPointerTool: ui.selectPointerTool,
        selectTextTool: ui.selectTextTool,
      })
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [
    activeFrame,
    frames.frames,
    layers.layers,
    layers.removeLayer,
    ui.selection,
    ui.selectPage,
    ui.selectPointerTool,
    ui.selectTextTool,
  ])

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
        ui.selectPointerTool()
      })
    },
    [frames.activeFrameId, layers, ui]
  )

  const handleSelectTextLayer = useCallback(
    (layerId: string) => {
      ui.selectElement(frames.activeFrameId, layerId)
      ui.selectPointerTool()
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
            ui.selectPageAndOpen(nextActiveId)
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
