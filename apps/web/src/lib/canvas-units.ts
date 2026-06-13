export type DimensionUnit = "px" | "cm"

export const DEFAULT_DPI = 300
export const MAX_PIXEL_DIMENSION = 8192
export const MAX_CM_DIMENSION = 70
export const PREVIEW_MAX_CSS = 720

export function cmToPixels(cm: number, dpi = DEFAULT_DPI): number {
  return Math.round((cm * dpi) / 2.54)
}

export function pixelsToCm(pixels: number, dpi = DEFAULT_DPI): number {
  return Math.round(((pixels * 2.54) / dpi) * 100) / 100
}

export function toPixelDimensions(
  width: number,
  height: number,
  unit: DimensionUnit,
  dpi = DEFAULT_DPI
): { widthPx: number; heightPx: number } {
  if (unit === "px") {
    return { widthPx: width, heightPx: height }
  }

  return {
    widthPx: cmToPixels(width, dpi),
    heightPx: cmToPixels(height, dpi),
  }
}

export function convertDimension(
  value: number,
  from: DimensionUnit,
  to: DimensionUnit,
  dpi = DEFAULT_DPI
): number {
  if (from === to) {
    return value
  }

  if (from === "px" && to === "cm") {
    return pixelsToCm(value, dpi)
  }

  return cmToPixels(value, dpi)
}

export function getPreviewScale(widthPx: number, heightPx: number): number {
  const largestSide = Math.max(widthPx, heightPx)
  if (largestSide <= PREVIEW_MAX_CSS) {
    return 1
  }

  return PREVIEW_MAX_CSS / largestSide
}

export function clampDimension(value: number, unit: DimensionUnit): number {
  if (unit === "px") {
    return Math.min(Math.max(Math.round(value), 1), MAX_PIXEL_DIMENSION)
  }

  return Math.min(
    Math.max(Math.round(value * 100) / 100, 0.1),
    MAX_CM_DIMENSION
  )
}
