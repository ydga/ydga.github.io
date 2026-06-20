import { useCallback, useRef, useState } from "react"

import {
  getLayersForFrame,
  removeLayersForFrame,
  reorderFrameLayers,
  textLayerDisplayName,
  type Layer,
  type ShapeLayer,
  type ShapeType,
  type TextLayer,
  type TextLayerUpdatePatch,
  type ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import {
  resolveShapeLayerFillBackground,
  shapeLayerDisplayName,
} from "@/features/designer/model/shape-layer-style"
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE_PX,
  DEFAULT_TEXT_FONT_WEIGHT,
} from "@/features/designer/model/text-layer-style"

export type NewTextLayerInput = {
  frameId: string
  x: number
  y: number
  width?: number
  height?: number
  text?: string
}

export type NewShapeLayerInput = {
  frameId: string
  shapeType: ShapeType
  x: number
  y: number
  width: number
  height: number
}

export function useDesignerLayers() {
  const [layers, setLayers] = useState<Layer[]>([])
  const shapeFillImageUrlRefs = useRef<Map<string, string>>(new Map())

  const revokeShapeFillImage = useCallback((layerId: string) => {
    const existingUrl = shapeFillImageUrlRefs.current.get(layerId)
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl)
      shapeFillImageUrlRefs.current.delete(layerId)
    }
  }, [])

  const revokeShapeFillImagesForLayers = useCallback(
    (layerIds: Iterable<string>) => {
      for (const layerId of layerIds) {
        revokeShapeFillImage(layerId)
      }
    },
    [revokeShapeFillImage]
  )

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
      fontWeight: DEFAULT_TEXT_FONT_WEIGHT,
      color: DEFAULT_TEXT_COLOR,
      lineHeightUnit: "auto",
      textSizing: explicitBounds ? "fixed" : "auto-width",
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

  const addShapeLayer = useCallback((input: NewShapeLayerInput) => {
    const id = crypto.randomUUID()

    const layer: ShapeLayer = {
      id,
      frameId: input.frameId,
      kind: "shape",
      name: shapeLayerDisplayName(input.shapeType),
      shapeType: input.shapeType,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
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

  const updateShapeLayer = useCallback(
    (layerId: string, patch: ShapeLayerUpdatePatch) => {
      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "shape") {
            return layer
          }

          return {
            ...layer,
            ...patch,
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

  const setShapeFillImage = useCallback(
    (layerId: string, file: File | null) => {
      revokeShapeFillImage(layerId)

      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "shape") {
            return layer
          }

          if (!file) {
            return {
              ...layer,
              fill: backgroundSettingsReducer(
                resolveShapeLayerFillBackground(layer),
                { type: "set-background-image", value: null }
              ),
            }
          }

          const objectUrl = URL.createObjectURL(file)
          shapeFillImageUrlRefs.current.set(layerId, objectUrl)

          return {
            ...layer,
            fill: backgroundSettingsReducer(
              resolveShapeLayerFillBackground(layer),
              { type: "set-background-image", value: objectUrl }
            ),
          }
        })
      )
    },
    [revokeShapeFillImage]
  )

  const removeLayersForFrameId = useCallback(
    (frameId: string) => {
      setLayers((current) => {
        const removedIds = current
          .filter(
            (layer) => layer.frameId === frameId && layer.kind === "shape"
          )
          .map((layer) => layer.id)
        revokeShapeFillImagesForLayers(removedIds)
        return removeLayersForFrame(current, frameId)
      })
    },
    [revokeShapeFillImagesForLayers]
  )

  const removeLayer = useCallback(
    (layerId: string) => {
      revokeShapeFillImage(layerId)
      setLayers((current) => current.filter((layer) => layer.id !== layerId))
    },
    [revokeShapeFillImage]
  )

  const getFrameLayers = useCallback(
    (frameId: string) => getLayersForFrame(layers, frameId),
    [layers]
  )

  return {
    layers,
    addTextLayer,
    addShapeLayer,
    updateTextLayer,
    updateShapeLayer,
    reorderLayers,
    removeLayersForFrame: removeLayersForFrameId,
    removeLayer,
    setShapeFillImage,
    getFrameLayers,
  }
}

export type DesignerLayers = ReturnType<typeof useDesignerLayers>
