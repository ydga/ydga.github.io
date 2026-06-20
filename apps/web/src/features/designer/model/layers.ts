/** How {@link TextLayer.lineHeight} is interpreted: `em` relative to font size, trim-space `px`, or `auto` (browser/canvas metrics). */
export type TextLayerLineHeightUnit = "px" | "em" | "auto"

/** How {@link TextLayer.letterSpacing} is stored: trim-space `px` or `em` (relative to font size). */
export type TextLayerLetterSpacingUnit = "px" | "em"

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
  /** CSS numeric `font-weight` (100–900). */
  fontWeight?: number
  /** Text fill, hex (e.g. `#111827`). */
  color?: string
  /** Line height: `em`, trim-space `px`, or `auto` (font-normal spacing). */
  lineHeight?: number
  lineHeightUnit?: TextLayerLineHeightUnit
  /**
   * `auto-width` — width and height follow text (line breaks only on newlines).
   * `auto-height` — fixed width, height follows wrapped text.
   * `fixed` — explicit width and height with wrap-to-width.
   * Legacy `hug` is treated as `auto-width`.
   */
  textSizing?: "auto-width" | "auto-height" | "fixed" | "hug"
  /** Horizontal alignment inside the text box (canvas, export, and editor). */
  textAlign?: "left" | "center" | "right"
  /** Vertical alignment of the line stack inside the box height. */
  verticalAlign?: "top" | "middle" | "bottom"
  /** Layer opacity 0–100 (default 100 = fully opaque). */
  opacity?: number
  /** Letter spacing value (in `letterSpacingUnit`; default 0 px). */
  letterSpacing?: number
  /** Unit for {@link TextLayer.letterSpacing}. Defaults to `"px"`. */
  letterSpacingUnit?: TextLayerLetterSpacingUnit
  /** CSS `text-decoration-line: underline` when true. */
  textUnderline?: boolean
  /** CSS `text-decoration-line: line-through` when true. */
  textStrikethrough?: boolean
  /** When false, text may draw outside the box (editor + export). Default true. */
  clip?: boolean
  /**
   * When true and sizing is `fixed`, changing width or height in the panel keeps
   * the previous width:height ratio. Default false.
   */
  maintainBoundsAspect?: boolean
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
    | "fontWeight"
    | "color"
    | "lineHeight"
    | "lineHeightUnit"
    | "opacity"
    | "letterSpacing"
    | "letterSpacingUnit"
    | "textSizing"
    | "textAlign"
    | "verticalAlign"
    | "textUnderline"
    | "textStrikethrough"
    | "clip"
    | "maintainBoundsAspect"
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
