import type { TextLayer } from "@/features/designer/model/layers"

/** Matches app `--font-sans` / `@fontsource-variable/inter`. */
export const DEFAULT_TEXT_FONT_FAMILY =
  '"Inter Variable", Inter, system-ui, sans-serif'

/** Previous default before Inter; normalized to {@link DEFAULT_TEXT_FONT_FAMILY}. */
const LEGACY_DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const DEFAULT_TEXT_FONT_SIZE_PX = 14

export const DEFAULT_TEXT_COLOR = "#111827"

export const DEFAULT_TEXT_LINE_HEIGHT = 1.35

/** Unitless line-height clamp (matches CSS; values below 1 give tighter leading). */
export const MIN_TEXT_LINE_HEIGHT = 0.5
export const MAX_TEXT_LINE_HEIGHT = 2.5

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

export function resolveTextLayerLineHeight(layer: TextLayer): number {
  const n = layer.lineHeight
  if (
    n == null ||
    !Number.isFinite(n) ||
    n < MIN_TEXT_LINE_HEIGHT ||
    n > MAX_TEXT_LINE_HEIGHT
  ) {
    return DEFAULT_TEXT_LINE_HEIGHT
  }
  return n
}
