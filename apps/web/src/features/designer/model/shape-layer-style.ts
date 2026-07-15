import type { ShapeLayer, ShapeType } from "@/features/designer/model/layers"
import type { BackgroundSettings } from "@/features/designer/model/types"
import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"

export const DEFAULT_SHAPE_FILL = "#6366f1"
export const DEFAULT_SHAPE_STROKE = "#111827"
export const DEFAULT_SHAPE_STROKE_WIDTH = 2
export const DEFAULT_SHAPE_OPACITY = 100
/** Common dashed stroke defaults (trim-space px). */
export const DEFAULT_STROKE_DASH = 8
export const DEFAULT_STROKE_GAP = 6
export const MIN_STROKE_DASH = 1
export const MAX_STROKE_DASH = 96
export const MIN_STROKE_GAP = 0
export const MAX_STROKE_GAP = 96

export type StrokeDashStyle = "solid" | "dashed"

export const DEFAULT_SHAPE_FILL_BACKGROUND: BackgroundSettings = {
  ...DEFAULT_CANVAS_SETTINGS.background,
  type: "color",
  color: DEFAULT_SHAPE_FILL,
}

export const TRANSPARENT_SHAPE_FILL_BACKGROUND: BackgroundSettings = {
  ...DEFAULT_CANVAS_SETTINGS.background,
  type: "transparent",
}

const SHAPE_LABELS: Record<ShapeType, string> = {
  circle: "Circle",
  square: "Square",
  triangle: "Triangle",
  line: "Line",
}

export function shapeLayerDisplayName(shapeType: ShapeType) {
  return SHAPE_LABELS[shapeType]
}

function isLegacyFillString(fill: ShapeLayer["fill"]): fill is string {
  return typeof fill === "string"
}

export function resolveShapeLayerFillBackground(layer: ShapeLayer) {
  if (layer.shapeType === "line") {
    return TRANSPARENT_SHAPE_FILL_BACKGROUND
  }

  const fill = layer.fill
  if (!fill) {
    return DEFAULT_SHAPE_FILL_BACKGROUND
  }

  if (isLegacyFillString(fill)) {
    return {
      ...DEFAULT_SHAPE_FILL_BACKGROUND,
      type: "color" as const,
      color: fill,
    }
  }

  return fill
}

export function isShapeFillTransparent(layer: ShapeLayer) {
  return resolveShapeLayerFillBackground(layer).type === "transparent"
}

export function resolveShapeLayerStroke(layer: ShapeLayer) {
  if (layer.shapeType === "line") {
    return layer.stroke ?? DEFAULT_SHAPE_STROKE
  }
  return layer.stroke ?? "transparent"
}

export function resolveShapeLayerStrokeWidth(layer: ShapeLayer) {
  return layer.strokeWidth ?? DEFAULT_SHAPE_STROKE_WIDTH
}

export function resolveShapeLayerStrokeDashStyle(
  layer: ShapeLayer
): StrokeDashStyle {
  return layer.strokeDashStyle === "dashed" ? "dashed" : "solid"
}

export function resolveShapeLayerStrokeDash(layer: ShapeLayer) {
  const raw = layer.strokeDash
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(MAX_STROKE_DASH, Math.max(MIN_STROKE_DASH, raw))
  }
  return DEFAULT_STROKE_DASH
}

export function resolveShapeLayerStrokeGap(layer: ShapeLayer) {
  const raw = layer.strokeGap
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(MAX_STROKE_GAP, Math.max(MIN_STROKE_GAP, raw))
  }
  return DEFAULT_STROKE_GAP
}

/**
 * SVG/canvas dash array in trim-space px, or `null` for a solid stroke.
 * Pass `scale` (e.g. displayScale) to convert to screen/export pixels.
 */
export function resolveShapeLayerStrokeDasharray(
  layer: ShapeLayer,
  scale = 1
): number[] | null {
  if (resolveShapeLayerStrokeDashStyle(layer) !== "dashed") {
    return null
  }
  const dash = resolveShapeLayerStrokeDash(layer) * scale
  const gap = resolveShapeLayerStrokeGap(layer) * scale
  return [dash, gap]
}

export function resolveShapeLayerOpacity(layer: ShapeLayer) {
  const value = layer.opacity ?? DEFAULT_SHAPE_OPACITY
  return Math.min(Math.max(value, 0), 100) / 100
}

export function resolveShapeLayerVisible(layer: ShapeLayer) {
  return layer.visible !== false
}

export function resolveLayerVisible(layer: { visible?: boolean }) {
  return layer.visible !== false
}
