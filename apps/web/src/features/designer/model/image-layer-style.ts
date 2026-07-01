import type { ImageLayer } from "@/features/designer/model/layers"
import type { BackgroundSettings } from "@/features/designer/model/types"
import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"

export const DEFAULT_IMAGE_OPACITY = 100

export const DEFAULT_IMAGE_FILL_BACKGROUND: BackgroundSettings = {
  ...DEFAULT_CANVAS_SETTINGS.background,
  type: "transparent",
}

export function imageLayerDisplayName() {
  return "Image"
}

export function resolveImageLayerFill(layer: ImageLayer) {
  return layer.fill ?? DEFAULT_IMAGE_FILL_BACKGROUND
}

export function imageLayerHasImage(layer: ImageLayer) {
  const fill = resolveImageLayerFill(layer)
  return fill.type === "image" && fill.imageSrc != null && fill.imageSrc.length > 0
}

export function resolveImageLayerOpacity(layer: ImageLayer) {
  const value = layer.opacity ?? DEFAULT_IMAGE_OPACITY
  return Math.min(Math.max(value, 0), 100) / 100
}

export function resolveImageLayerVisible(layer: ImageLayer) {
  return layer.visible !== false
}
