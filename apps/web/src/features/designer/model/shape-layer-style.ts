import type { ShapeLayer, ShapeType } from "@/features/designer/model/layers"
import type { BackgroundSettings } from "@/features/designer/model/types"
import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"

export const DEFAULT_SHAPE_FILL = "#6366f1"
export const DEFAULT_SHAPE_STROKE = "#111827"
export const DEFAULT_SHAPE_STROKE_WIDTH = 2
export const DEFAULT_SHAPE_OPACITY = 100

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
