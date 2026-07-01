import { useCallback, useRef, useState } from "react"

import {
  getLayersForFrame,
  removeLayersForFrame,
  reorderFrameLayers,
  textLayerDisplayName,
  type ImageLayer,
  type ImageLayerUpdatePatch,
  type Layer,
  type ShapeLayer,
  type ShapeType,
  type TextLayer,
  type TextLayerUpdatePatch,
  type ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import { loadImage } from "@/features/designer/lib/render-background"
import {
  DEFAULT_IMAGE_FILL_BACKGROUND,
  imageLayerDisplayName,
  resolveImageLayerFill,
} from "@/features/designer/model/image-layer-style"
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

export type NewImageLayerFromFileInput = {
  frameId: string
  file: File
  trimWidthPx: number
  trimHeightPx: number
}

export function useDesignerLayers() {
  const [layers, setLayers] = useState<Layer[]>([])
  const shapeFillImageUrlRefs = useRef<Map<string, string>>(new Map())
  const imageLayerUrlRefs = useRef<Map<string, string>>(new Map())

  const revokeShapeFillImage = useCallback((layerId: string) => {
    const existingUrl = shapeFillImageUrlRefs.current.get(layerId)
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl)
      shapeFillImageUrlRefs.current.delete(layerId)
    }
  }, [])

  const revokeImageLayerFile = useCallback((layerId: string) => {
    const existingUrl = imageLayerUrlRefs.current.get(layerId)
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl)
      imageLayerUrlRefs.current.delete(layerId)
    }
  }, [])

  const revokeLayerAssets = useCallback(
    (layer: Layer) => {
      if (layer.kind === "shape") {
        revokeShapeFillImage(layer.id)
      }
      if (layer.kind === "image") {
        revokeImageLayerFile(layer.id)
      }
    },
    [revokeImageLayerFile, revokeShapeFillImage]
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

  const addImageLayerFromFile = useCallback(
    async (input: NewImageLayerFromFileInput): Promise<string | null> => {
      if (!input.file.type.startsWith("image/")) {
        return null
      }

      const objectUrl = URL.createObjectURL(input.file)

      try {
        const image = await loadImage(objectUrl)
        const width = image.naturalWidth
        const height = image.naturalHeight

        if (width <= 0 || height <= 0) {
          URL.revokeObjectURL(objectUrl)
          return null
        }

        const x = Math.max(0, (input.trimWidthPx - width) / 2)
        const y = Math.max(0, (input.trimHeightPx - height) / 2)
        const id = crypto.randomUUID()

        const layer: ImageLayer = {
          id,
          frameId: input.frameId,
          kind: "image",
          name: imageLayerDisplayName(),
          x,
          y,
          width,
          height,
          fill: backgroundSettingsReducer(DEFAULT_IMAGE_FILL_BACKGROUND, {
            type: "set-background-image",
            value: objectUrl,
          }),
        }

        imageLayerUrlRefs.current.set(id, objectUrl)

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
      } catch {
        URL.revokeObjectURL(objectUrl)
        return null
      }
    },
    []
  )

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

  const updateImageLayer = useCallback(
    (layerId: string, patch: ImageLayerUpdatePatch) => {
      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "image") {
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

  const setImageLayerFile = useCallback(
    (layerId: string, file: File | null) => {
      revokeImageLayerFile(layerId)

      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "image") {
            return layer
          }

          if (!file) {
            return {
              ...layer,
              fill: backgroundSettingsReducer(resolveImageLayerFill(layer), {
                type: "set-background-image",
                value: null,
              }),
            }
          }

          const objectUrl = URL.createObjectURL(file)
          imageLayerUrlRefs.current.set(layerId, objectUrl)

          return {
            ...layer,
            fill: backgroundSettingsReducer(resolveImageLayerFill(layer), {
              type: "set-background-image",
              value: objectUrl,
            }),
          }
        })
      )
    },
    [revokeImageLayerFile]
  )

  const removeLayersForFrameId = useCallback(
    (frameId: string) => {
      setLayers((current) => {
        const removed = current.filter((layer) => layer.frameId === frameId)
        for (const layer of removed) {
          revokeLayerAssets(layer)
        }
        return removeLayersForFrame(current, frameId)
      })
    },
    [revokeLayerAssets]
  )

  const removeLayer = useCallback(
    (layerId: string) => {
      setLayers((current) => {
        const layer = current.find((entry) => entry.id === layerId)
        if (layer) {
          revokeLayerAssets(layer)
        }
        return current.filter((entry) => entry.id !== layerId)
      })
    },
    [revokeLayerAssets]
  )

  const getFrameLayers = useCallback(
    (frameId: string) => getLayersForFrame(layers, frameId),
    [layers]
  )

  return {
    layers,
    addTextLayer,
    addShapeLayer,
    addImageLayerFromFile,
    updateTextLayer,
    updateShapeLayer,
    updateImageLayer,
    reorderLayers,
    removeLayersForFrame: removeLayersForFrameId,
    removeLayer,
    setShapeFillImage,
    setImageLayerFile,
    getFrameLayers,
  }
}

export type DesignerLayers = ReturnType<typeof useDesignerLayers>
