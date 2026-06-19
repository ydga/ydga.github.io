import type { TextLayer } from "@/features/designer/model/layers"
import {
  resolveTextLayerCanvasFont,
  resolveTextLayerFontSizePx,
  resolveTextLayerLineHeightUnit,
  resolveTextLayerLineHeightValue,
} from "@/features/designer/model/text-layer-style"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36
/** Extra trim px so hug boxes clear glyphs, caret, and textarea padding. */
const TEXT_HUG_WIDTH_PAD_PX = 12

function wrapLine(
  context: CanvasRenderingContext2D,
  line: string,
  maxWidthPx: number
): string[] {
  const trimmed = line.trimEnd()
  if (trimmed.length === 0) {
    return [""]
  }

  const words = trimmed.split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (context.measureText(test).width <= maxWidthPx) {
      current = test
    } else {
      if (current) {
        lines.push(current)
      }
      current = word
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.length > 0 ? lines : [""]
}

export function buildWrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number
): string[] {
  const paragraphs = text.split("\n")
  const out: string[] = []

  for (const paragraph of paragraphs) {
    const wrapped = wrapLine(context, paragraph, maxWidthPx)
    out.push(...wrapped)
  }

  return out.length > 0 ? out : [""]
}

/** One visual line per `\\n` in the source; no width-based word wrapping. */
export function buildNewlineOnlyLines(text: string): string[] {
  if (text.length === 0) {
    return [""]
  }
  return text.split("\n")
}

/**
 * Lines for canvas / layout: soft-wrap at `maxWidthPx` when `softWrap` is true;
 * otherwise only break at newline characters.
 */
export function buildDisplayLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
  softWrap: boolean
): string[] {
  return softWrap
    ? buildWrappedLines(context, text, maxWidthPx)
    : buildNewlineOnlyLines(text)
}

/**
 * Trim-space line height for `lineHeightUnit: "auto"`, approximating CSS
 * `line-height: normal` from font metrics (with a simple fallback when `ctx`
 * is null, e.g. conversion math without a canvas).
 */
export function autoLineHeightApproxTrimPx(
  layer: TextLayer,
  ctx: CanvasRenderingContext2D | null
): number {
  const fs = resolveTextLayerFontSizePx(layer)
  if (ctx) {
    ctx.font = resolveTextLayerCanvasFont(layer)
    const m = ctx.measureText("Mg")
    const ascent =
      m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? fs * 0.74
    const descent =
      m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? fs * 0.26
    const core = ascent + descent
    return Math.max(1, Math.round(core * 1.1))
  }
  return Math.max(1, Math.round(fs * 1.2))
}

/** Rounded trim-space line height used for stacking and export. */
export function textLineHeightTrimPx(
  layer: TextLayer,
  ctx: CanvasRenderingContext2D | null
): number {
  const fs = resolveTextLayerFontSizePx(layer)
  const unit = resolveTextLayerLineHeightUnit(layer)
  if (unit === "auto") {
    return autoLineHeightApproxTrimPx(layer, ctx)
  }
  const v = resolveTextLayerLineHeightValue(layer)
  if (unit === "px") {
    return v
  }
  return Math.max(1, Math.round(fs * v))
}

function measureAdornedLineWidth(
  ctx: CanvasRenderingContext2D,
  line: string
): number {
  const sample = line.length > 0 ? line : " "
  const m = ctx.measureText(sample)
  let w = m.width
  const left = m.actualBoundingBoxLeft
  const right = m.actualBoundingBoxRight
  if (
    left !== undefined &&
    right !== undefined &&
    Number.isFinite(left) &&
    Number.isFinite(right)
  ) {
    w = Math.max(w, right - Math.min(0, left))
  }
  return w
}

/**
 * Trim-space height of the stacked text block: every line uses the same resolved
 * line-height (matches CSS / Figma-style auto layout), for both fixed wrap and hug.
 */
export function textLayerTextBlockHeightTrimPx(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  maxWidthPx: number,
  softWrap: boolean
): number {
  const wrapW = Math.max(32, maxWidthPx)
  const lineHeight = textLineHeightTrimPx(layer, ctx)
  const lines = buildDisplayLines(ctx, layer.text, wrapW, softWrap)
  return lines.length * lineHeight
}

/** Vertical advance after drawing one line (same trim px as {@link textLayerTextBlockHeightTrimPx}). */
export function lineAdvanceTrimPx(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  _line: string,
  _softWrap: boolean
): number {
  return textLineHeightTrimPx(layer, ctx)
}

/**
 * Trim-space offset to shift the first line down so the text block fits
 * `boxHeightTrim` with vertical alignment.
 */
export function verticalTextOffsetTrimPx(
  boxHeightTrim: number,
  contentBlockHeightTrim: number,
  verticalAlign: "top" | "middle" | "bottom"
): number {
  const extra = Math.max(0, boxHeightTrim - contentBlockHeightTrim)
  if (verticalAlign === "middle") {
    return extra / 2
  }
  if (verticalAlign === "bottom") {
    return extra
  }
  return 0
}

/**
 * Bounding box in trim pixels (same rules as export draw).
 * When `softWrap` is false (`hug`), lines break only at newline characters and
 * both width and height follow that content (width is not capped by `maxWrapWidthPx`).
 */
export function measureTextLayerContentBox(
  layer: TextLayer,
  maxWrapWidthPx: number,
  softWrap: boolean = true
): { width: number; height: number } {
  const wrapW = Number.isFinite(maxWrapWidthPx)
    ? Math.max(32, maxWrapWidthPx)
    : Number.MAX_SAFE_INTEGER

  if (typeof document === "undefined") {
    return {
      width: Math.max(MIN_W_TRIM, layer.width),
      height: Math.max(MIN_H_TRIM, layer.height),
    }
  }

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return {
      width: Math.max(MIN_W_TRIM, layer.width),
      height: Math.max(MIN_H_TRIM, layer.height),
    }
  }

  ctx.font = resolveTextLayerCanvasFont(layer)
  const lines = buildDisplayLines(ctx, layer.text, wrapW, softWrap)

  let maxLineW = 0
  for (const line of lines) {
    maxLineW = Math.max(maxLineW, measureAdornedLineWidth(ctx, line))
  }

  const rawWidth = Math.ceil(
    Math.max(MIN_W_TRIM, maxLineW + (softWrap ? 0 : TEXT_HUG_WIDTH_PAD_PX))
  )
  // Fixed: cap by wrap width. Hug (newline-only): width is purely content-driven.
  const width = softWrap
    ? Math.ceil(Math.min(wrapW, rawWidth))
    : Math.ceil(rawWidth)

  const blockH = textLayerTextBlockHeightTrimPx(ctx, layer, wrapW, softWrap)
  const height = Math.ceil(Math.max(MIN_H_TRIM, blockH))

  return { width, height }
}
