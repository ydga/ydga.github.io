/** How {@link TextLayer.lineHeight} is interpreted (default: unitless multiplier). */
export type TextLayerLineHeightUnit = "unitless" | "px" | "em"

export type TextLayer = {
  id: string
  frameId: string
  kind: "text"
  name: string
  x: number
  y: number
  width: number
  text: string
  height: number
  /** CSS `font-family` stack (trim-space pixels). */
  fontFamily?: string
  /** Font size in trim-space pixels (matches canvas export). */
  fontSizePx?: number
  /** Text fill, hex (e.g. `#111827`). */
  color?: string
  /** Unitless multiplier, trim px, or `em` (see {@link TextLayerLineHeightUnit}). */
  lineHeight?: number
  lineHeightUnit?: TextLayerLineHeightUnit
  /** `hug` — width and height both follow text; `fixed` — width and height set explicitly. */
  textSizing?: "hug" | "fixed"
  /** Horizontal alignment inside the text box (canvas, export, and editor). */
  textAlign?: "left" | "center" | "right"
  /** Vertical alignment of the line stack inside the box height. */
  verticalAlign?: "top" | "middle" | "bottom"
  /** CSS `text-decoration-line: underline` when true. */
  textUnderline?: boolean
  /** CSS `text-decoration-line: line-through` when true. */
  textStrikethrough?: boolean
  /** When false, text may draw outside the box (editor + export). Default true. */
  clip?: boolean
}

export type TextLayerUpdatePatch = Partial<
  Pick<
    TextLayer,
    | "text"
    | "x"
    | "y"
    | "width"
    | "height"
    | "fontFamily"
    | "fontSizePx"
    | "color"
    | "lineHeight"
    | "lineHeightUnit"
    | "textSizing"
    | "textAlign"
    | "verticalAlign"
    | "textUnderline"
    | "textStrikethrough"
    | "clip"
  >
>

export type Layer = TextLayer

const TEXT_LAYER_LABEL_MAX = 28

export function textLayerDisplayName(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return "Text"
  }

  const firstLine = trimmed.split("\n")[0] ?? trimmed
  return firstLine.length > TEXT_LAYER_LABEL_MAX
    ? `${firstLine.slice(0, TEXT_LAYER_LABEL_MAX)}…`
    : firstLine
}

export function isTextLayer(layer: Layer): layer is TextLayer {
  return layer.kind === "text"
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
