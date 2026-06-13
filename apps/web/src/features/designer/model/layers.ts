export type Layer = {
  id: string
  frameId: string
  name: string
}

export function getLayersForFrame(layers: Layer[], frameId: string) {
  return layers.filter((layer) => layer.frameId === frameId)
}

export function removeLayersForFrame(layers: Layer[], frameId: string) {
  return layers.filter((layer) => layer.frameId !== frameId)
}

export function reorderFrameLayers(
  layers: Layer[],
  frameId: string,
  fromIndex: number,
  toIndex: number
): Layer[] {
  const frameEntries = layers.flatMap((layer, index) =>
    layer.frameId === frameId ? [{ layer, index }] : []
  )
  const frameLayers = frameEntries.map(({ layer }) => layer)
  const reordered = reorderLayers(frameLayers, fromIndex, toIndex)

  if (reordered === frameLayers) {
    return layers
  }

  const next = [...layers]
  frameEntries.forEach(({ index }, position) => {
    next[index] = reordered[position]!
  })
  return next
}

export function reorderLayers(
  layers: Layer[],
  fromIndex: number,
  toIndex: number
): Layer[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= layers.length ||
    toIndex >= layers.length
  ) {
    return layers
  }

  const next = [...layers]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
