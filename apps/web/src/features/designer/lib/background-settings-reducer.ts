import type {
  BackgroundFit,
  BackgroundSettings,
  BackgroundType,
  GradientStop,
} from "@/features/designer/model/types"
import {
  normalizeBackgroundGradient,
  normalizeGradientStops,
  sortGradientStops,
} from "@/features/designer/lib/gradient-stops"

export type BackgroundSettingsAction =
  | { type: "set-background-type"; value: BackgroundType }
  | { type: "set-background-color"; value: string }
  | { type: "set-background-gradient-end"; value: string }
  | { type: "set-background-gradient-stops"; value: GradientStop[] }
  | {
      type: "set-background-gradient-axis-start"
      value: { x: number; y: number }
    }
  | {
      type: "set-background-gradient-axis-end"
      value: { x: number; y: number }
    }
  | { type: "set-background-gradient-angle"; value: number }
  | { type: "set-background-image"; value: string | null }
  | { type: "set-background-fit"; value: BackgroundFit }

function normalizeGradientAngle(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export function backgroundSettingsReducer(
  background: BackgroundSettings,
  action: BackgroundSettingsAction
): BackgroundSettings {
  switch (action.type) {
    case "set-background-type": {
      if (action.value === "gradient") {
        return normalizeBackgroundGradient({
          ...background,
          type: action.value,
        })
      }

      return { ...background, type: action.value }
    }
    case "set-background-color":
      return { ...background, color: action.value }
    case "set-background-gradient-end": {
      const currentStops =
        background.gradientStops ??
        normalizeBackgroundGradient(background).gradientStops

      return {
        ...background,
        gradientEnd: action.value,
        gradientStops: normalizeGradientStops(
          currentStops.map((stop, index, stops) =>
            index === stops.length - 1 ? { ...stop, color: action.value } : stop
          )
        ),
      }
    }
    case "set-background-gradient-stops":
      return normalizeBackgroundGradient({
        ...background,
        gradientStops: normalizeGradientStops(action.value),
        gradientEnd:
          sortGradientStops(normalizeGradientStops(action.value)).at(-1)
            ?.color ?? background.gradientEnd,
      })
    case "set-background-gradient-axis-start":
      return normalizeBackgroundGradient({
        ...background,
        gradientStartX: action.value.x,
        gradientStartY: action.value.y,
      })
    case "set-background-gradient-axis-end":
      return normalizeBackgroundGradient({
        ...background,
        gradientEndX: action.value.x,
        gradientEndY: action.value.y,
      })
    case "set-background-gradient-angle":
      return {
        ...background,
        gradientAngle: normalizeGradientAngle(action.value),
      }
    case "set-background-image":
      return {
        ...background,
        type: "image",
        imageSrc: action.value,
      }
    case "set-background-fit":
      return { ...background, fit: action.value }
    default:
      return background
  }
}
