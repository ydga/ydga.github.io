import { useCallback, useState } from "react"

import {
  getLayersForFrame,
  removeLayersForFrame,
  reorderFrameLayers,
  textLayerDisplayName,
  type Layer,
  type TextLayer,
  type TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE_PX,
} from "@/features/designer/model/text-layer-style"

export type NewTextLayerInput = {
  frameId: string
  x: number
  y: number
  width?: number
  height?: number
  text?: string
}

export function useDesignerLayers() {
  const [layers, setLayers] = useState<Layer[]>([])

  const addTextLayer = useCallback((input: NewTextLayerInput) => {
    const id = crypto.randomUUID()
    const text = input.text ?? ""
    const width = input.width ?? 200
    /** Drag-to-place supplies both dimensions → fixed wrap box; tap uses hug for both axes. */
    const explicitBounds =
      input.width !== undefined && input.height !== undefined

    const layer: TextLayer = {
      id,
      frameId: input.frameId,
      kind: "text",
      name: textLayerDisplayName(text),
      x: input.x,
      y: input.y,
      width,
      height: input.height ?? 72,
      text,
      fontFamily: DEFAULT_TEXT_FONT_FAMILY,
      fontSizePx: DEFAULT_TEXT_FONT_SIZE_PX,
      color: DEFAULT_TEXT_COLOR,
      textSizing: explicitBounds ? "fixed" : "hug",
    }

    setLayers((prev) => {
      const firstIdx = prev.findIndex((l) => l.frameId === input.frameId)
      if (firstIdx === -1) {
        return [...prev, layer]
      }
      const next = [...prev]
      next.splice(firstIdx, 0, layer)
      return next
    })

    return id
  }, [])

  const updateTextLayer = useCallback(
    (layerId: string, patch: TextLayerUpdatePatch) => {
      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "text") {
            return layer
          }

          const nextText = patch.text !== undefined ? patch.text : layer.text
          return {
            ...layer,
            ...patch,
            name: textLayerDisplayName(nextText),
          }
        })
      )
    },
    []
  )

  const reorderLayers = useCallback(
    (frameId: string, fromIndex: number, toIndex: number) => {
      setLayers((current) =>
        reorderFrameLayers(current, frameId, fromIndex, toIndex)
      )
    },
    []
  )

  const removeLayersForFrameId = useCallback((frameId: string) => {
    setLayers((current) => removeLayersForFrame(current, frameId))
  }, [])

  const removeLayer = useCallback((layerId: string) => {
    setLayers((current) => current.filter((layer) => layer.id !== layerId))
  }, [])

  const getFrameLayers = useCallback(
    (frameId: string) => getLayersForFrame(layers, frameId),
    [layers]
  )

  return {
    layers,
    addTextLayer,
    updateTextLayer,
    reorderLayers,
    removeLayersForFrame: removeLayersForFrameId,
    removeLayer,
    getFrameLayers,
  }
}

export type DesignerLayers = ReturnType<typeof useDesignerLayers>
