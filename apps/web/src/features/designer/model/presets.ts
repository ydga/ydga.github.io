import type { CanvasSettings } from "@/features/designer/model/types"

export type CanvasPreset = {
  id: string
  label: string
  description: string
  width: number
  height: number
  unit: CanvasSettings["unit"]
  print?: {
    bleedEnabled: boolean
    bleed: number
    safeEnabled: boolean
    safeInset: number
  }
}

export const PX_PRESETS: CanvasPreset[] = [
  {
    id: "instagram-post-square",
    label: "Instagram post",
    description: "1080 × 1080",
    width: 1080,
    height: 1080,
    unit: "px",
  },
  {
    id: "instagram-post-portrait",
    label: "Instagram portrait",
    description: "1080 × 1350",
    width: 1080,
    height: 1350,
    unit: "px",
  },
  {
    id: "instagram-post-landscape",
    label: "Instagram landscape",
    description: "1080 × 566",
    width: 1080,
    height: 566,
    unit: "px",
  },
  {
    id: "instagram-story",
    label: "Instagram story",
    description: "1080 × 1920",
    width: 1080,
    height: 1920,
    unit: "px",
  },
]

const PRINT_DEFAULTS = {
  bleedEnabled: true,
  bleed: 0.3,
  safeEnabled: true,
  safeInset: 0.3,
}

const US_PRINT_DEFAULTS = {
  bleedEnabled: true,
  bleed: 0.3175,
  safeEnabled: true,
  safeInset: 0.3175,
}

export const CM_PRESETS: CanvasPreset[] = [
  {
    id: "us-letter",
    label: "US Letter",
    description: "21.6 × 27.9 cm",
    width: 21.59,
    height: 27.94,
    unit: "cm",
    print: US_PRINT_DEFAULTS,
  },
  {
    id: "us-legal",
    label: "US Legal",
    description: "21.6 × 35.6 cm",
    width: 21.59,
    height: 35.56,
    unit: "cm",
    print: US_PRINT_DEFAULTS,
  },
  {
    id: "a4",
    label: "A4",
    description: "21 × 29.7 cm",
    width: 21,
    height: 29.7,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "a5",
    label: "A5",
    description: "14.8 × 21 cm",
    width: 14.8,
    height: 21,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "photo-4x6",
    label: "4 × 6 photo",
    description: "10.2 × 15.2 cm",
    width: 10.16,
    height: 15.24,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "photo-5x7",
    label: "5 × 7 photo",
    description: "12.7 × 17.8 cm",
    width: 12.7,
    height: 17.78,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
]

export function getPresetsForUnit(
  unit: CanvasSettings["unit"]
): CanvasPreset[] {
  return unit === "px" ? PX_PRESETS : CM_PRESETS
}

export function isPresetActive(
  preset: CanvasPreset,
  width: number,
  height: number,
  unit: CanvasSettings["unit"]
): boolean {
  if (preset.unit !== unit) {
    return false
  }

  if (unit === "px") {
    return preset.width === width && preset.height === height
  }

  return (
    Math.abs(preset.width - width) < 0.01 &&
    Math.abs(preset.height - height) < 0.01
  )
}
