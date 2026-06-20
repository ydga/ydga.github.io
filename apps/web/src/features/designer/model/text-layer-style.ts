import type {
  TextLayer,
  TextLayerLetterSpacingUnit,
  TextLayerLineHeightUnit,
} from "@/features/designer/model/layers"

/** Matches app `--font-sans` / `@fontsource-variable/inter`. */
export const DEFAULT_TEXT_FONT_FAMILY =
  '"Inter Variable", Inter, system-ui, sans-serif'

/** Previous default before Inter; normalized to {@link DEFAULT_TEXT_FONT_FAMILY}. */
const LEGACY_DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const DEFAULT_TEXT_FONT_SIZE_PX = 14

/** CSS numeric `font-weight` for new and unset text layers. */
export const DEFAULT_TEXT_FONT_WEIGHT = 400

export const MIN_TEXT_FONT_WEIGHT = 100
export const MAX_TEXT_FONT_WEIGHT = 900

/** Font weight options in the text settings panel (CSS numeric weights). */
export const TEXT_LAYER_FONT_WEIGHT_PRESETS: ReadonlyArray<{
  label: string
  value: number
}> = [
  { label: "Thin", value: 100 },
  { label: "Extra light", value: 200 },
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra bold", value: 800 },
  { label: "Black", value: 900 },
]

export const DEFAULT_TEXT_COLOR = "#111827"

/** Default line height when using `em` (relative to font size). */
export const DEFAULT_TEXT_LINE_HEIGHT = 1.35

/** `em` line-height bounds (CSS `em`, relative to font size). */
export const MIN_TEXT_LINE_HEIGHT_EM = 0.25
export const MAX_TEXT_LINE_HEIGHT_EM = 6

/** Trim-space px line-height bounds (export canvas). */
export const MIN_TEXT_LINE_HEIGHT_PX = 1
export const MAX_TEXT_LINE_HEIGHT_PX = 2000

export type TextLayerSizing = "auto-width" | "auto-height" | "fixed"

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

/**
 * Widely used Google Fonts (see `apps/web/index.html`). First family matches
 * the loaded face so canvas and editor stay aligned.
 */
export const TEXT_LAYER_GOOGLE_FONT_PRESETS: ReadonlyArray<{
  label: string
  value: string
}> = [
  { label: "Roboto", value: "'Roboto', system-ui, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { label: "Lato", value: "'Lato', system-ui, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', system-ui, sans-serif" },
  { label: "Poppins", value: "'Poppins', system-ui, sans-serif" },
  { label: "Oswald", value: "'Oswald', system-ui, sans-serif" },
  { label: "Raleway", value: "'Raleway', system-ui, sans-serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "Source Sans 3", value: "'Source Sans 3', system-ui, sans-serif" },
  { label: "Nunito Sans", value: "'Nunito Sans', system-ui, sans-serif" },
]

/** Presets + Google Fonts shown in the font picker. */
export const TEXT_LAYER_ALL_FONT_CHOICES: ReadonlyArray<{
  label: string
  value: string
}> = [...TEXT_LAYER_FONT_PRESETS, ...TEXT_LAYER_GOOGLE_FONT_PRESETS]

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

export function resolveTextLayerFontWeight(layer: TextLayer): number {
  const w = layer.fontWeight
  if (w == null || !Number.isFinite(w)) {
    return DEFAULT_TEXT_FONT_WEIGHT
  }
  const n = Math.round(w)
  return Math.min(MAX_TEXT_FONT_WEIGHT, Math.max(MIN_TEXT_FONT_WEIGHT, n))
}

/** `CanvasRenderingContext2D.font` string (weight, size, family). */
export function resolveTextLayerCanvasFont(layer: TextLayer): string {
  const weight = resolveTextLayerFontWeight(layer)
  const size = resolveTextLayerFontSizePx(layer)
  const family = resolveTextLayerFontFamily(layer)
  return `${weight} ${size}px ${family}`
}

export function resolveTextLayerColor(layer: TextLayer): string {
  return layer.color ?? DEFAULT_TEXT_COLOR
}

export function resolveTextLayerSizing(layer: TextLayer): TextLayerSizing {
  const raw = layer.textSizing
  if (raw === "hug" || raw === "auto-width") {
    return "auto-width"
  }
  if (raw === "auto-height") {
    return "auto-height"
  }
  return "fixed"
}

export function resolveTextLayerLineHeightUnit(
  layer: TextLayer
): TextLayerLineHeightUnit {
  const u = layer.lineHeightUnit as
    | TextLayerLineHeightUnit
    | "unitless"
    | undefined
  if (u === "unitless") {
    return "em"
  }
  if (u === "px" || u === "em" || u === "auto") {
    return u
  }
  const raw = layer.lineHeight
  if (raw == null || !Number.isFinite(raw)) {
    return "auto"
  }
  return "em"
}

/** Resolved numeric `lineHeight` for the active unit (display + layout math). */
export function resolveTextLayerLineHeightValue(layer: TextLayer): number {
  const unit = resolveTextLayerLineHeightUnit(layer)
  if (unit === "auto") {
    return DEFAULT_TEXT_LINE_HEIGHT
  }
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
    return DEFAULT_TEXT_LINE_HEIGHT
  }

  if (unit === "px") {
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_PX,
      Math.max(MIN_TEXT_LINE_HEIGHT_PX, Math.round(raw))
    )
  }
  const rounded = Math.round(raw * 100) / 100
  return Math.min(
    MAX_TEXT_LINE_HEIGHT_EM,
    Math.max(MIN_TEXT_LINE_HEIGHT_EM, rounded)
  )
}

/** CSS `line-height` for components that need a string (px, em, or `normal`). */
export function resolveTextLayerLineHeightCss(layer: TextLayer): string {
  const unit = resolveTextLayerLineHeightUnit(layer)
  if (unit === "auto") {
    return "normal"
  }
  const v = resolveTextLayerLineHeightValue(layer)
  return unit === "px" ? `${v}px` : `${v}em`
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

export function resolveTextLayerMaintainBoundsAspect(
  layer: TextLayer
): boolean {
  return layer.maintainBoundsAspect === true
}

/** Layer opacity as a 0–1 fraction (CSS-ready). Default is 1 (fully opaque). */
export function resolveTextLayerOpacity(layer: TextLayer): number {
  const v = layer.opacity
  if (v == null || !Number.isFinite(v)) return 1
  return Math.min(1, Math.max(0, v / 100))
}

export function resolveTextLayerLetterSpacingUnit(
  layer: TextLayer
): TextLayerLetterSpacingUnit {
  return layer.letterSpacingUnit === "em" ? "em" : "px"
}

/** Resolved letter-spacing value in its stored unit. 0 means no spacing. */
export function resolveTextLayerLetterSpacingValue(layer: TextLayer): number {
  const v = layer.letterSpacing
  return v != null && Number.isFinite(v) ? v : 0
}

/** CSS `letter-spacing` string (`"0px"`, `"2px"`, `"0.05em"`, …). */
export function resolveTextLayerLetterSpacingCss(layer: TextLayer): string {
  const unit = resolveTextLayerLetterSpacingUnit(layer)
  const v = resolveTextLayerLetterSpacingValue(layer)
  return `${v}${unit}`
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

/** Resolved CSS `text-transform` value. Defaults to `"none"`. */
export function resolveTextLayerTextTransform(
  layer: TextLayer
): "none" | "uppercase" | "lowercase" {
  const v = layer.textTransform
  if (v === "uppercase" || v === "lowercase") return v
  return "none"
}

/**
 * Returns the display string for a text layer, applying any `textTransform`
 * so the canvas (which doesn't support CSS text-transform) renders correctly.
 */
export function applyTextTransform(text: string, layer: TextLayer): string {
  const t = resolveTextLayerTextTransform(layer)
  if (t === "uppercase") return text.toUpperCase()
  if (t === "lowercase") return text.toLowerCase()
  return text
}
