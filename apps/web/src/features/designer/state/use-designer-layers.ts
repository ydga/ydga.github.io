import { useCallback, useState } from "react"

import {
  getLayersForFrame,
  removeLayersForFrame,
  reorderFrameLayers,
  type Layer,
} from "@/features/designer/model/layers"

export function useDesignerLayers() {
  const [layers, setLayers] = useState<Layer[]>([])

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

  const getFrameLayers = useCallback(
    (frameId: string) => getLayersForFrame(layers, frameId),
    [layers]
  )

  return {
    layers,
    reorderLayers,
    removeLayersForFrame: removeLayersForFrameId,
    getFrameLayers,
  }
}

export type DesignerLayers = ReturnType<typeof useDesignerLayers>
