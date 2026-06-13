import type {
  CanvasSettings,
  PixelScale,
  PrintDpi,
  ScreenExportFormat,
} from "@/features/designer/model/types"

export type PageExportOverrides = {
  pixelScale: PixelScale
  screenFormat: ScreenExportFormat
  dpi: PrintDpi
}

export function createPageExportOverrides(
  settings: CanvasSettings
): PageExportOverrides {
  return {
    pixelScale: settings.pixelScale,
    screenFormat: settings.export.screenFormat,
    dpi: settings.dpi,
  }
}

export function mergeExportOverrides(
  settings: CanvasSettings,
  overrides: PageExportOverrides
): CanvasSettings {
  return {
    ...settings,
    pixelScale: overrides.pixelScale,
    dpi: overrides.dpi,
    export: {
      ...settings.export,
      screenFormat: overrides.screenFormat,
    },
  }
}
