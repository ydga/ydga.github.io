export type DimensionUnit = "px" | "cm"
export type PixelScale = 1 | 2
export type PrintDpi = 300 | 260 | 220 | 172
export type BackgroundType = "color" | "image"
export type BackgroundFit = "cover" | "contain" | "fit" | "tile"

export type BackgroundSettings = {
  type: BackgroundType
  color: string
  imageSrc: string | null
  fit: BackgroundFit
}

export type PrintZoneSettings = {
  bleedEnabled: boolean
  bleed: number
  safeEnabled: boolean
  safeInset: number
}

export type GuideSettings = {
  showTrim: boolean
  showBleed: boolean
  showSafe: boolean
  showCenter: boolean
  showThirds: boolean
}

export type CanvasSettings = {
  width: number
  height: number
  unit: DimensionUnit
  dpi: PrintDpi
  pixelScale: PixelScale
  background: BackgroundSettings
  print: PrintZoneSettings
  guides: GuideSettings
}

export type ExportDimensions = {
  trimWidthPx: number
  trimHeightPx: number
  exportWidthPx: number
  exportHeightPx: number
  bleedPx: number
  safeInsetPx: number
}

export type GuideRect = {
  x: number
  y: number
  width: number
  height: number
}

export type GuideGeometry = {
  exportWidthPx: number
  exportHeightPx: number
  trim: GuideRect
  safe: GuideRect
}
