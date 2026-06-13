import { useCallback, useReducer, useRef } from "react"

import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"
import type { CanvasPreset } from "@/features/designer/model/presets"
import type {
  BackgroundFit,
  BackgroundType,
  CanvasSettings,
  DimensionUnit,
  DocumentIntent,
  ExportBurnInSettings,
  PixelScale,
  PrintDpi,
  ScreenExportFormat,
} from "@/features/designer/model/types"
import {
  clampDimension,
  convertDimension,
} from "@/features/designer/lib/dimensions"
import { intentToUnit } from "@/features/designer/lib/document-intent"

export type DesignerAction =
  | { type: "set-width"; value: number }
  | { type: "set-height"; value: number }
  | { type: "set-unit"; value: DimensionUnit }
  | { type: "set-intent"; value: DocumentIntent }
  | { type: "set-dpi"; value: PrintDpi }
  | { type: "set-pixel-scale"; value: PixelScale }
  | { type: "rotate-orientation" }
  | { type: "apply-preset"; preset: CanvasPreset }
  | { type: "set-background-type"; value: BackgroundType }
  | { type: "set-background-color"; value: string }
  | { type: "set-background-gradient-end"; value: string }
  | { type: "set-background-gradient-angle"; value: number }
  | { type: "set-background-image"; value: string | null }
  | { type: "set-background-fit"; value: BackgroundFit }
  | { type: "set-bleed-enabled"; value: boolean }
  | { type: "set-bleed"; value: number }
  | { type: "set-safe-enabled"; value: boolean }
  | { type: "set-safe-inset"; value: number }
  | { type: "set-guide"; key: keyof CanvasSettings["guides"]; value: boolean }
  | { type: "set-screen-export-format"; value: ScreenExportFormat }
  | {
      type: "set-export-burn-in"
      key: keyof ExportBurnInSettings
      value: boolean
    }

function applyUnitChange(
  settings: CanvasSettings,
  nextUnit: DimensionUnit
): CanvasSettings {
  if (nextUnit === settings.unit) {
    return settings
  }

  return {
    ...settings,
    unit: nextUnit,
    width: clampDimension(
      convertDimension(settings.width, settings.unit, nextUnit, settings.dpi),
      nextUnit
    ),
    height: clampDimension(
      convertDimension(settings.height, settings.unit, nextUnit, settings.dpi),
      nextUnit
    ),
    print:
      nextUnit === "px"
        ? {
            ...settings.print,
            bleedEnabled: false,
            safeEnabled: false,
          }
        : settings.print,
    guides:
      nextUnit === "px"
        ? {
            ...settings.guides,
            showTrim: false,
            showBleed: false,
            showSafe: false,
          }
        : settings.guides,
  }
}

export function designerReducer(
  settings: CanvasSettings,
  action: DesignerAction
): CanvasSettings {
  switch (action.type) {
    case "set-width":
      return {
        ...settings,
        width: clampDimension(action.value, settings.unit),
      }
    case "set-height":
      return {
        ...settings,
        height: clampDimension(action.value, settings.unit),
      }
    case "set-unit":
      return applyUnitChange(settings, action.value)
    case "set-intent":
      return applyUnitChange(settings, intentToUnit(action.value))
    case "set-dpi":
      return { ...settings, dpi: action.value }
    case "set-pixel-scale":
      return { ...settings, pixelScale: action.value }
    case "rotate-orientation":
      return {
        ...settings,
        width: settings.height,
        height: settings.width,
      }
    case "apply-preset": {
      const { preset } = action
      return {
        ...settings,
        unit: preset.unit,
        width: clampDimension(preset.width, preset.unit),
        height: clampDimension(preset.height, preset.unit),
        print: preset.print
          ? { ...preset.print }
          : {
              bleedEnabled: false,
              bleed: settings.print.bleed,
              safeEnabled: false,
              safeInset: settings.print.safeInset,
            },
      }
    }
    case "set-background-type":
      return {
        ...settings,
        background: { ...settings.background, type: action.value },
      }
    case "set-background-color":
      return {
        ...settings,
        background: { ...settings.background, color: action.value },
      }
    case "set-background-gradient-end":
      return {
        ...settings,
        background: { ...settings.background, gradientEnd: action.value },
      }
    case "set-background-gradient-angle":
      return {
        ...settings,
        background: {
          ...settings.background,
          gradientAngle: normalizeGradientAngle(action.value),
        },
      }
    case "set-background-image":
      return {
        ...settings,
        background: {
          ...settings.background,
          type: "image",
          imageSrc: action.value,
        },
      }
    case "set-background-fit":
      return {
        ...settings,
        background: { ...settings.background, fit: action.value },
      }
    case "set-bleed-enabled":
      if (settings.unit === "px") {
        return settings
      }
      return {
        ...settings,
        print: { ...settings.print, bleedEnabled: action.value },
        guides: action.value
          ? settings.guides
          : { ...settings.guides, showBleed: false },
      }
    case "set-bleed":
      if (settings.unit === "px") {
        return settings
      }
      return {
        ...settings,
        print: {
          ...settings.print,
          bleed: clampDimension(action.value, settings.unit),
        },
      }
    case "set-safe-enabled":
      if (settings.unit === "px") {
        return settings
      }
      return {
        ...settings,
        print: { ...settings.print, safeEnabled: action.value },
      }
    case "set-safe-inset":
      if (settings.unit === "px") {
        return settings
      }
      return {
        ...settings,
        print: {
          ...settings.print,
          safeInset: clampDimension(action.value, settings.unit),
        },
      }
    case "set-guide":
      if (
        settings.unit === "px" &&
        (action.key === "showTrim" ||
          action.key === "showBleed" ||
          action.key === "showSafe") &&
        action.value
      ) {
        return settings
      }
      return {
        ...settings,
        guides: { ...settings.guides, [action.key]: action.value },
      }
    case "set-screen-export-format":
      return {
        ...settings,
        export: { ...settings.export, screenFormat: action.value },
      }
    case "set-export-burn-in":
      return {
        ...settings,
        export: {
          ...settings.export,
          burnIn: {
            ...settings.export.burnIn,
            [action.key]: action.value,
          },
        },
      }
    default:
      return settings
  }
}

function normalizeGradientAngle(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export function useDesignerSettings() {
  const [settings, dispatch] = useReducer(
    designerReducer,
    DEFAULT_CANVAS_SETTINGS
  )
  const imageUrlRef = useRef<string | null>(null)

  const setBackgroundImage = useCallback((file: File | null) => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }

    if (!file) {
      dispatch({ type: "set-background-image", value: null })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    imageUrlRef.current = objectUrl
    dispatch({
      type: "set-background-image",
      value: objectUrl,
    })
  }, [])

  return { settings, dispatch, setBackgroundImage }
}

export type DesignerDispatch = ReturnType<
  typeof useDesignerSettings
>["dispatch"]
