import type {
  CanvasSettings,
  DocumentIntent,
} from "@/features/designer/model/types"
import { unitToIntent } from "@/features/designer/lib/document-intent"

export type PresetCategory = DocumentIntent

export type CanvasPreset = {
  id: string
  category: PresetCategory
  label: string
  description: string
  aspectRatio: number
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

export const SCREEN_PRESETS: CanvasPreset[] = [
  {
    id: "instagram-post-square",
    category: "screen",
    label: "Post",
    description: "1080 × 1080",
    aspectRatio: 1,
    width: 1080,
    height: 1080,
    unit: "px",
  },
  {
    id: "instagram-post-portrait",
    category: "screen",
    label: "Portrait",
    description: "1080 × 1350",
    aspectRatio: 1080 / 1350,
    width: 1080,
    height: 1350,
    unit: "px",
  },
  {
    id: "instagram-post-landscape",
    category: "screen",
    label: "Landscape",
    description: "1080 × 566",
    aspectRatio: 1080 / 566,
    width: 1080,
    height: 566,
    unit: "px",
  },
  {
    id: "instagram-story",
    category: "screen",
    label: "Story",
    description: "1080 × 1920",
    aspectRatio: 1080 / 1920,
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

export const PRINT_PRESETS: CanvasPreset[] = [
  {
    id: "us-letter",
    category: "print",
    label: "Letter",
    description: "21.6 × 27.9",
    aspectRatio: 21.59 / 27.94,
    width: 21.59,
    height: 27.94,
    unit: "cm",
    print: US_PRINT_DEFAULTS,
  },
  {
    id: "us-legal",
    category: "print",
    label: "Legal",
    description: "21.6 × 35.6",
    aspectRatio: 21.59 / 35.56,
    width: 21.59,
    height: 35.56,
    unit: "cm",
    print: US_PRINT_DEFAULTS,
  },
  {
    id: "a4",
    category: "print",
    label: "A4",
    description: "21 × 29.7",
    aspectRatio: 21 / 29.7,
    width: 21,
    height: 29.7,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "a5",
    category: "print",
    label: "A5",
    description: "14.8 × 21",
    aspectRatio: 14.8 / 21,
    width: 14.8,
    height: 21,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "photo-4x6",
    category: "print",
    label: "4×6",
    description: "10.2 × 15.2",
    aspectRatio: 10.16 / 15.24,
    width: 10.16,
    height: 15.24,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
  {
    id: "photo-5x7",
    category: "print",
    label: "5×7",
    description: "12.7 × 17.8",
    aspectRatio: 12.7 / 17.78,
    width: 12.7,
    height: 17.78,
    unit: "cm",
    print: PRINT_DEFAULTS,
  },
]

export function getPresetsForIntent(intent: DocumentIntent): CanvasPreset[] {
  return intent === "screen" ? SCREEN_PRESETS : PRINT_PRESETS
}

export function getPresetsForUnit(
  unit: CanvasSettings["unit"]
): CanvasPreset[] {
  return getPresetsForIntent(unitToIntent(unit))
}

export function getPresetCategoryForSettings(
  settings: CanvasSettings
): PresetCategory {
  return unitToIntent(settings.unit)
}

export function findMatchingPreset(
  width: number,
  height: number,
  unit: CanvasSettings["unit"]
): CanvasPreset | null {
  return (
    getPresetsForUnit(unit).find((preset) =>
      isPresetActive(preset, width, height, unit)
    ) ?? null
  )
}

export function formatDimensionsLabel(
  width: number,
  height: number,
  unit: CanvasSettings["unit"]
): string {
  const dimensions =
    unit === "px"
      ? `${width} × ${height}`
      : `${formatDecimal(width)} × ${formatDecimal(height)}`

  return `${dimensions} ${unit}`
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
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
