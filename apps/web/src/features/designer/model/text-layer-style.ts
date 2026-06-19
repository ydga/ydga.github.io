import type {
  TextLayer,
  TextLayerLineHeightUnit,
} from "@/features/designer/model/layers"

/** Matches app `--font-sans` / `@fontsource-variable/inter`. */
export const DEFAULT_TEXT_FONT_FAMILY =
  '"Inter Variable", Inter, system-ui, sans-serif'

/** Previous default before Inter; normalized to {@link DEFAULT_TEXT_FONT_FAMILY}. */
const LEGACY_DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const DEFAULT_TEXT_FONT_SIZE_PX = 14

export const DEFAULT_TEXT_COLOR = "#111827"

export const DEFAULT_TEXT_LINE_HEIGHT = 1.35

/** Unitless CSS line-height multiplier (matches CSS; minimum enforced). */
export const MIN_TEXT_LINE_HEIGHT = 0.5

/** `em` line-height bounds (CSS `em`, relative to font size). */
export const MIN_TEXT_LINE_HEIGHT_EM = 0.25
export const MAX_TEXT_LINE_HEIGHT_EM = 6

/** Trim-space px line-height bounds (export canvas). */
export const MIN_TEXT_LINE_HEIGHT_PX = 1
export const MAX_TEXT_LINE_HEIGHT_PX = 2000

export type TextLayerSizing = "hug" | "fixed"

export const TEXT_LAYER_FONT_PRESETS: ReadonlyArray<{
  label: string
  value: string
}> = [
  { label: "Inter", value: DEFAULT_TEXT_FONT_FAMILY },
  {
    label: "Serif",
    value: "Georgia, Cambria, 'Times New Roman', serif",
  },
  {
    label: "Monospace",
    value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
]

export function resolveTextLayerFontFamily(layer: TextLayer): string {
  const raw = layer.fontFamily?.trim()
  if (!raw || raw === LEGACY_DEFAULT_TEXT_FONT_FAMILY) {
    return DEFAULT_TEXT_FONT_FAMILY
  }
  return raw
}

export function resolveTextLayerFontSizePx(layer: TextLayer): number {
  const n = layer.fontSizePx
  if (n == null || !Number.isFinite(n) || n < 1) {
    return DEFAULT_TEXT_FONT_SIZE_PX
  }
  return n
}

export function resolveTextLayerColor(layer: TextLayer): string {
  return layer.color ?? DEFAULT_TEXT_COLOR
}

export function resolveTextLayerSizing(layer: TextLayer): TextLayerSizing {
  return layer.textSizing === "hug" ? "hug" : "fixed"
}

export function resolveTextLayerLineHeightUnit(
  layer: TextLayer
): TextLayerLineHeightUnit {
  const u = layer.lineHeightUnit
  if (u === "px" || u === "em") {
    return u
  }
  return "unitless"
}

/** Resolved numeric `lineHeight` for the active unit (display + layout math). */
export function resolveTextLayerLineHeightValue(layer: TextLayer): number {
  const unit = resolveTextLayerLineHeightUnit(layer)
  const raw = layer.lineHeight
  const fs = resolveTextLayerFontSizePx(layer)

  if (raw == null || !Number.isFinite(raw)) {
    if (unit === "px") {
      return Math.min(
        MAX_TEXT_LINE_HEIGHT_PX,
        Math.max(
          MIN_TEXT_LINE_HEIGHT_PX,
          Math.round(fs * DEFAULT_TEXT_LINE_HEIGHT)
        )
      )
    }
    if (unit === "em") {
      return DEFAULT_TEXT_LINE_HEIGHT
    }
    return DEFAULT_TEXT_LINE_HEIGHT
  }

  if (unit === "px") {
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_PX,
      Math.max(MIN_TEXT_LINE_HEIGHT_PX, Math.round(raw))
    )
  }
  if (unit === "em") {
    const rounded = Math.round(raw * 100) / 100
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_EM,
      Math.max(MIN_TEXT_LINE_HEIGHT_EM, rounded)
    )
  }
  return Math.max(MIN_TEXT_LINE_HEIGHT, raw)
}

/** CSS `line-height` for the canvas textarea (number = unitless). */
export function resolveTextLayerLineHeightCss(
  layer: TextLayer
): string | number {
  const unit = resolveTextLayerLineHeightUnit(layer)
  const v = resolveTextLayerLineHeightValue(layer)
  if (unit === "px") {
    return `${v}px`
  }
  if (unit === "em") {
    return `${v}em`
  }
  return v
}

export function resolveTextLayerTextAlign(
  layer: TextLayer
): "left" | "center" | "right" {
  const a = layer.textAlign
  if (a === "center" || a === "right") {
    return a
  }
  return "left"
}

export function resolveTextLayerVerticalAlign(
  layer: TextLayer
): "top" | "middle" | "bottom" {
  const v = layer.verticalAlign
  if (v === "middle" || v === "bottom") {
    return v
  }
  return "top"
}

export function resolveTextLayerUnderline(layer: TextLayer): boolean {
  return layer.textUnderline === true
}

export function resolveTextLayerStrikethrough(layer: TextLayer): boolean {
  return layer.textStrikethrough === true
}

/** When true (default), text is clipped to the layer bounds in preview and export. */
export function resolveTextLayerClip(layer: TextLayer): boolean {
  return layer.clip !== false
}

/** Value for CSS `text-decoration-line` (editor preview). */
export function resolveTextLayerTextDecorationLine(layer: TextLayer): string {
  const u = resolveTextLayerUnderline(layer)
  const s = resolveTextLayerStrikethrough(layer)
  if (u && s) {
    return "underline line-through"
  }
  if (u) {
    return "underline"
  }
  if (s) {
    return "line-through"
  }
  return "none"
}
