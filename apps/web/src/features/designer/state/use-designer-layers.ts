import { useCallback, useRef, useState } from "react"

import {
  duplicateLayerInPlace as duplicateLayerInPlaceModel,
  getLayersForFrame,
  groupLayers as groupLayersModel,
  removeLayersForFrame,
  renameLayer as renameLayerModel,
  reorderFrameLayers,
  reorderFrameLayersById,
  textLayerDisplayName,
  ungroupLayer as ungroupLayerModel,
  type GroupLayerUpdatePatch,
  type Layer,
  type ShapeLayer,
  type ShapeType,
  type TextLayer,
  type TextLayerUpdatePatch,
  type ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import {
  boundsFromAbsolutePoints,
  lineGeometryFromEndpoints,
} from "@/features/designer/model/line-geometry"
import {
  isVertexEditableShapeType,
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
  /** Absolute trim-space polyline for lines (preferred over box diagonal). */
  absolutePoints?: Array<{ x: number; y: number }>
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

    let x = input.x
    let y = input.y
    let width = input.width
    let height = input.height
    let points: Array<{ x: number; y: number }> | undefined

    if (isVertexEditableShapeType(input.shapeType)) {
      if (input.absolutePoints && input.absolutePoints.length >= 2) {
        const geometry = boundsFromAbsolutePoints(input.absolutePoints)
        x = geometry.x
        y = geometry.y
        width = geometry.width
        height = geometry.height
        points = geometry.points
      } else {
        const geometry = lineGeometryFromEndpoints(
          input.x,
          input.y,
          input.x + input.width,
          input.y + input.height
        )
        x = geometry.x
        y = geometry.y
        width = geometry.width
        height = geometry.height
        points = geometry.points
      }
    }

    const layer: ShapeLayer = {
      id,
      frameId: input.frameId,
      kind: "shape",
      name: shapeLayerDisplayName(input.shapeType),
      shapeType: input.shapeType,
      x,
      y,
      width,
      height,
      ...(points ? { points } : {}),
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
          const nextName =
            patch.name !== undefined
              ? patch.name.trim() || layer.name
              : patch.text !== undefined
                ? textLayerDisplayName(nextText)
                : layer.name

          return {
            ...layer,
            ...patch,
            name: nextName,
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

          const nextName =
            patch.name !== undefined
              ? patch.name.trim() || layer.name
              : layer.name

          return {
            ...layer,
            ...patch,
            name: nextName,
          }
        })
      )
    },
    []
  )

  const updateGroupLayer = useCallback(
    (layerId: string, patch: GroupLayerUpdatePatch) => {
      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId || layer.kind !== "group") {
            return layer
          }
          const nextName =
            patch.name !== undefined
              ? patch.name.trim() || layer.name
              : layer.name
          return {
            ...layer,
            ...patch,
            name: nextName,
          }
        })
      )
    },
    []
  )

  const renameLayer = useCallback((layerId: string, name: string) => {
    setLayers((current) => renameLayerModel(current, layerId, name))
  }, [])

  const groupLayers = useCallback((frameId: string, layerIds: string[]) => {
    let groupId: string | null = null
    setLayers((current) => {
      const result = groupLayersModel(current, frameId, layerIds)
      if (!result) {
        return current
      }
      groupId = result.groupId
      return result.layers
    })
    return groupId
  }, [])

  const ungroupLayer = useCallback((groupId: string) => {
    setLayers((current) => ungroupLayerModel(current, groupId))
  }, [])

  const reorderLayers = useCallback(
    (frameId: string, fromIndex: number, toIndex: number) => {
      setLayers((current) =>
        reorderFrameLayers(current, frameId, fromIndex, toIndex)
      )
    },
    []
  )

  const reorderLayersById = useCallback(
    (frameId: string, fromLayerId: string, toLayerId: string) => {
      setLayers((current) =>
        reorderFrameLayersById(current, frameId, fromLayerId, toLayerId)
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
      setLayers((current) => {
        const target = current.find((layer) => layer.id === layerId)
        if (target?.kind === "group") {
          // Removing a group ungroups children instead of deleting them.
          return ungroupLayerModel(current, layerId)
        }
        revokeShapeFillImage(layerId)
        return current.filter((layer) => layer.id !== layerId)
      })
    },
    [revokeShapeFillImage]
  )

  /** Leave a clone; optional `at` pins it when the source already moved. */
  const duplicateLayerInPlace = useCallback(
    (layerId: string, at?: { x: number; y: number }) => {
      setLayers((current) =>
        duplicateLayerInPlaceModel(current, layerId, at)
      )
    },
    []
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
    updateGroupLayer,
    renameLayer,
    groupLayers,
    ungroupLayer,
    reorderLayers,
    reorderLayersById,
    removeLayersForFrame: removeLayersForFrameId,
    removeLayer,
    duplicateLayerInPlace,
    setShapeFillImage,
    getFrameLayers,
  }
}

export type DesignerLayers = ReturnType<typeof useDesignerLayers>
