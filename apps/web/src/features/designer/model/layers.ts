/** How {@link TextLayer.lineHeight} is interpreted: `em` relative to font size, trim-space `px`, or `auto` (browser/canvas metrics). */
export type TextLayerLineHeightUnit = "px" | "em" | "auto"

import type { BackgroundSettings } from "@/features/designer/model/types"

/** How {@link TextLayer.letterSpacing} is stored: trim-space `px` or `em` (relative to font size). */
export type TextLayerLetterSpacingUnit = "px" | "em"

export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "line"
  | "pen"
  | "polygon"

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
  /** When false, layer is hidden on canvas and export. Default true. */
  visible?: boolean
  /** Letter spacing value (in `letterSpacingUnit`; default 0 px). */
  letterSpacing?: number
  /** Unit for {@link TextLayer.letterSpacing}. Defaults to `"px"`. */
  letterSpacingUnit?: TextLayerLetterSpacingUnit
  /** CSS `text-decoration-line: underline` when true. */
  textUnderline?: boolean
  /** CSS `text-decoration-line: line-through` when true. */
  textStrikethrough?: boolean
  /** CSS `text-transform`: `"uppercase"` | `"lowercase"` | `"none"` (default). */
  textTransform?: "none" | "uppercase" | "lowercase"
  /** When false, text may draw outside the box (editor + export). Default true. */
  clip?: boolean
  /**
   * When true and sizing is `fixed`, changing width or height in the panel keeps
   * the previous width:height ratio. Default false.
   */
  maintainBoundsAspect?: boolean
  /** When set, this layer is nested under a {@link GroupLayer}. */
  parentId?: string
}

export type TextLayerUpdatePatch = Partial<
  Pick<
    TextLayer,
    | "name"
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
    | "visible"
    | "letterSpacing"
    | "letterSpacingUnit"
    | "textSizing"
    | "textAlign"
    | "verticalAlign"
    | "textUnderline"
    | "textStrikethrough"
    | "textTransform"
    | "clip"
    | "maintainBoundsAspect"
    | "parentId"
  >
>

export type ShapeLayer = {
  id: string
  frameId: string
  kind: "shape"
  name: string
  shapeType: ShapeType
  x: number
  y: number
  width: number
  height: number
  /**
   * Polyline vertices relative to {@link x}/{@link y}. Used by lines (≥2 points).
   * Legacy lines without `points` render as the box diagonal (0,0)→(width,height).
   */
  points?: Array<{ x: number; y: number }>
  /** Fill for closed shapes; solid, gradient, image, or transparent. Ignored for lines. */
  fill?: BackgroundSettings | string
  /** Stroke color; primary color for lines. */
  stroke?: string
  /** Stroke width in trim-space pixels. */
  strokeWidth?: number
  /** Solid vs dashed stroke. Defaults to solid. */
  strokeDashStyle?: "solid" | "dashed"
  /** Dash segment length in trim-space px (when dashed). */
  strokeDash?: number
  /** Gap between dashes in trim-space px (when dashed). */
  strokeGap?: number
  /** Layer opacity 0–100 (default 100 = fully opaque). */
  opacity?: number
  /** When false, layer is hidden on canvas and export. Default true. */
  visible?: boolean
  /** When set, this layer is nested under a {@link GroupLayer}. */
  parentId?: string
}

export type ShapeLayerUpdatePatch = Partial<
  Pick<
    ShapeLayer,
    | "name"
    | "x"
    | "y"
    | "width"
    | "height"
    | "points"
    | "fill"
    | "stroke"
    | "strokeWidth"
    | "strokeDashStyle"
    | "strokeDash"
    | "strokeGap"
    | "opacity"
    | "visible"
    | "parentId"
  >
>

export type GroupLayer = {
  id: string
  frameId: string
  kind: "group"
  name: string
  /** When false, group and its children are hidden. Default true. */
  visible?: boolean
  /** When true, children are collapsed in the layers list. */
  collapsed?: boolean
}

export type GroupLayerUpdatePatch = Partial<
  Pick<GroupLayer, "name" | "visible" | "collapsed">
>

export type Layer = TextLayer | ShapeLayer | GroupLayer

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

export function isShapeLayer(layer: Layer): layer is ShapeLayer {
  return layer.kind === "shape"
}

export function isGroupLayer(layer: Layer): layer is GroupLayer {
  return layer.kind === "group"
}

export function isDrawableLayer(
  layer: Layer
): layer is TextLayer | ShapeLayer {
  return layer.kind === "text" || layer.kind === "shape"
}

export function getLayersForFrame(layers: Layer[], frameId: string) {
  return layers.filter((layer) => layer.frameId === frameId)
}

/** Flat list for the layers panel: groups followed by their children. */
export function getLayerListRows(
  layers: Layer[],
  frameId: string
): Array<{ layer: Layer; depth: number }> {
  const frameLayers = getLayersForFrame(layers, frameId)
  const childrenByParent = new Map<string, Layer[]>()

  for (const layer of frameLayers) {
    if (isDrawableLayer(layer) && layer.parentId) {
      const list = childrenByParent.get(layer.parentId) ?? []
      list.push(layer)
      childrenByParent.set(layer.parentId, list)
    }
  }

  const rows: Array<{ layer: Layer; depth: number }> = []
  for (const layer of frameLayers) {
    if (isDrawableLayer(layer) && layer.parentId) {
      continue
    }
    rows.push({ layer, depth: 0 })
    if (layer.kind === "group" && !layer.collapsed) {
      const children = childrenByParent.get(layer.id) ?? []
      for (const child of children) {
        rows.push({ layer: child, depth: 1 })
      }
    }
  }
  return rows
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

export function reorderFrameLayersById(
  layers: Layer[],
  frameId: string,
  fromLayerId: string,
  toLayerId: string
): Layer[] {
  const frameLayers = getLayersForFrame(layers, frameId)
  const fromIndex = frameLayers.findIndex((layer) => layer.id === fromLayerId)
  const toIndex = frameLayers.findIndex((layer) => layer.id === toLayerId)
  if (fromIndex < 0 || toIndex < 0) {
    return layers
  }
  return reorderFrameLayers(layers, frameId, fromIndex, toIndex)
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

/** Deep-enough clone for drag-duplicate; caller supplies a fresh id. */
export function cloneLayer(layer: Layer, newId: string): Layer {
  if (layer.kind === "group") {
    return { ...layer, id: newId }
  }

  if (layer.kind === "text") {
    return { ...layer, id: newId }
  }

  const points = layer.points?.map((p) => ({ ...p }))
  const fill = layer.fill
  if (fill && typeof fill === "object") {
    return {
      ...layer,
      id: newId,
      points,
      fill: {
        ...fill,
        gradientStops: fill.gradientStops.map((stop) => ({ ...stop })),
      },
    }
  }

  return { ...layer, id: newId, points }
}

/**
 * Insert a clone of `layerId` immediately after it (below in paint order).
 * Optional `at` pins the clone (used when the source already moved mid-drag).
 * Groups are not duplicated (children would need deep copy).
 */
export function duplicateLayerInPlace(
  layers: Layer[],
  layerId: string,
  at?: { x: number; y: number }
): Layer[] {
  const index = layers.findIndex((layer) => layer.id === layerId)
  if (index === -1) {
    return layers
  }

  const source = layers[index]!
  if (source.kind === "group") {
    return layers
  }

  const clone = cloneLayer(source, crypto.randomUUID())
  if (at && isDrawableLayer(clone)) {
    clone.x = at.x
    clone.y = at.y
  }
  const next = [...layers]
  next.splice(index + 1, 0, clone)
  return next
}

/**
 * Wrap the given drawable layers in a new group. Uses the earliest frame
 * position among the selection as the group's insert point.
 */
export function groupLayers(
  layers: Layer[],
  frameId: string,
  layerIds: string[]
): { layers: Layer[]; groupId: string } | null {
  const uniqueIds = [...new Set(layerIds)]
  const selected = layers.filter(
    (layer): layer is TextLayer | ShapeLayer =>
      layer.frameId === frameId &&
      uniqueIds.includes(layer.id) &&
      isDrawableLayer(layer) &&
      !layer.parentId
  )
  if (selected.length < 2) {
    return null
  }

  const selectedIds = new Set(selected.map((layer) => layer.id))
  const groupId = crypto.randomUUID()
  const group: GroupLayer = {
    id: groupId,
    frameId,
    kind: "group",
    name: "Group",
  }

  const next: Layer[] = []
  let inserted = false
  for (const layer of layers) {
    if (layer.frameId !== frameId) {
      next.push(layer)
      continue
    }
    if (selectedIds.has(layer.id)) {
      if (!inserted) {
        next.push(group)
        for (const child of selected) {
          next.push({ ...child, parentId: groupId })
        }
        inserted = true
      }
      continue
    }
    next.push(layer)
  }

  return { layers: next, groupId }
}

/** Remove a group and promote its children to the root of the frame. */
export function ungroupLayer(layers: Layer[], groupId: string): Layer[] {
  const group = layers.find(
    (layer) => layer.id === groupId && layer.kind === "group"
  )
  if (!group) {
    return layers
  }

  return layers
    .filter((layer) => layer.id !== groupId)
    .map((layer) => {
      if (isDrawableLayer(layer) && layer.parentId === groupId) {
        return { ...layer, parentId: undefined }
      }
      return layer
    })
}

export function renameLayer(
  layers: Layer[],
  layerId: string,
  name: string
): Layer[] {
  const trimmed = name.trim()
  if (!trimmed) {
    return layers
  }
  return layers.map((layer) =>
    layer.id === layerId ? { ...layer, name: trimmed } : layer
  )
}
