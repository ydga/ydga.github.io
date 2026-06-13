import type {
  CanvasSettings,
  DimensionUnit,
  ExportDimensions,
  PixelScale,
  PrintDpi,
} from "@/features/designer/model/types"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import {
  DEFAULT_DPI,
  MAX_CM_DIMENSION,
  MAX_PIXEL_DIMENSION,
  PREVIEW_MAX_CSS,
} from "@/features/designer/model/defaults"

export const PRINT_DPI_OPTIONS = [300, 260, 220, 172] as const
export const PIXEL_SCALE_OPTIONS: PixelScale[] = [1, 2]

export type ExportOptions = {
  dpi?: PrintDpi
  pixelScale?: PixelScale
}

export function cmToPixels(cm: number, dpi = DEFAULT_DPI): number {
  return Math.round((cm * dpi) / 2.54)
}

export function pixelsToCm(pixels: number, dpi = DEFAULT_DPI): number {
  return Math.round(((pixels * 2.54) / dpi) * 100) / 100
}

export function toTrimPixelDimensions(
  width: number,
  height: number,
  unit: DimensionUnit,
  options: ExportOptions = {}
): { widthPx: number; heightPx: number } {
  const dpi = options.dpi ?? DEFAULT_DPI
  const pixelScale = options.pixelScale ?? 1

  if (unit === "px") {
    return {
      widthPx: clampExportPixels(Math.round(width * pixelScale)),
      heightPx: clampExportPixels(Math.round(height * pixelScale)),
    }
  }

  return {
    widthPx: clampExportPixels(cmToPixels(width, dpi)),
    heightPx: clampExportPixels(cmToPixels(height, dpi)),
  }
}

function clampExportPixels(value: number): number {
  return Math.min(Math.max(value, 1), MAX_PIXEL_DIMENSION)
}

export function edgeToPixels(
  value: number,
  unit: DimensionUnit,
  options: ExportOptions = {}
): number {
  const dpi = options.dpi ?? DEFAULT_DPI
  const pixelScale = options.pixelScale ?? 1

  if (unit === "px") {
    return Math.round(value * pixelScale)
  }

  return cmToPixels(value, dpi)
}

/** Widest frame trim width — fit zoom is based on this so all frames share one scale. */
export function getMaxTrimWidthPx(settingsList: CanvasSettings[]): number {
  if (settingsList.length === 0) {
    return 1
  }

  return Math.max(
    1,
    ...settingsList.map((settings) => getExportDimensions(settings).trimWidthPx)
  )
}

export function getExportDimensions(
  settings: CanvasSettings
): ExportDimensions {
  const exportOptions = {
    dpi: settings.dpi,
    pixelScale: settings.pixelScale,
  }
  const trim = toTrimPixelDimensions(
    settings.width,
    settings.height,
    settings.unit,
    exportOptions
  )

  const printDoc = isPrintDocument(settings)

  const bleedPx =
    printDoc && settings.print.bleedEnabled && settings.print.bleed > 0
      ? edgeToPixels(settings.print.bleed, settings.unit, exportOptions)
      : 0

  const safeInsetPx =
    printDoc && settings.print.safeEnabled && settings.print.safeInset > 0
      ? edgeToPixels(settings.print.safeInset, settings.unit, exportOptions)
      : 0

  return {
    trimWidthPx: trim.widthPx,
    trimHeightPx: trim.heightPx,
    exportWidthPx: clampExportPixels(trim.widthPx + bleedPx * 2),
    exportHeightPx: clampExportPixels(trim.heightPx + bleedPx * 2),
    bleedPx,
    safeInsetPx,
  }
}

export function isExportOverLimit(settings: CanvasSettings): boolean {
  const exportOptions = {
    dpi: settings.dpi,
    pixelScale: settings.pixelScale,
  }
  const dpi = exportOptions.dpi ?? DEFAULT_DPI
  const pixelScale = exportOptions.pixelScale ?? 1

  const rawTrimWidth =
    settings.unit === "px"
      ? Math.round(settings.width * pixelScale)
      : cmToPixels(settings.width, dpi)
  const rawTrimHeight =
    settings.unit === "px"
      ? Math.round(settings.height * pixelScale)
      : cmToPixels(settings.height, dpi)

  const printDoc = isPrintDocument(settings)
  const bleedPx =
    printDoc && settings.print.bleedEnabled && settings.print.bleed > 0
      ? edgeToPixels(settings.print.bleed, settings.unit, exportOptions)
      : 0

  const rawExportWidth = rawTrimWidth + bleedPx * 2
  const rawExportHeight = rawTrimHeight + bleedPx * 2

  return (
    rawExportWidth > MAX_PIXEL_DIMENSION ||
    rawExportHeight > MAX_PIXEL_DIMENSION
  )
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

export function clampDimension(value: number, unit: DimensionUnit): number {
  if (unit === "px") {
    return Math.min(Math.max(Math.round(value), 1), MAX_PIXEL_DIMENSION)
  }

  return Math.min(
    Math.max(Math.round(value * 100) / 100, 0.1),
    MAX_CM_DIMENSION
  )
}

export function getPreviewScale(exportWidthPx: number, exportHeightPx: number) {
  const largestSide = Math.max(exportWidthPx, exportHeightPx)
  if (largestSide <= PREVIEW_MAX_CSS) {
    return 1
  }

  return PREVIEW_MAX_CSS / largestSide
}

export function isPrintDpi(value: number): value is PrintDpi {
  return PRINT_DPI_OPTIONS.includes(value as PrintDpi)
}
