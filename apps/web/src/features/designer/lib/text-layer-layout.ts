import type { TextLayer } from "@/features/designer/model/layers"
import {
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerLineHeight,
} from "@/features/designer/model/text-layer-style"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36
/** Extra trim px so hug boxes clear glyphs, caret, and textarea padding. */
const TEXT_HUG_WIDTH_PAD_PX = 12
const TEXT_HUG_HEIGHT_PAD_PX = 6

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

/** Rounded line height in px for layout, hug measurement, and export draw. */
export function textLineHeightTrimPx(layer: TextLayer): number {
  return Math.round(
    resolveTextLayerFontSizePx(layer) * resolveTextLayerLineHeight(layer)
  )
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

function hugLineVisualHeightPx(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  line: string
): number {
  const base = textLineHeightTrimPx(layer)
  const sample = line.length > 0 ? line : " "
  const m = ctx.measureText(sample)
  if (
    m.actualBoundingBoxAscent !== undefined &&
    m.actualBoundingBoxDescent !== undefined &&
    Number.isFinite(m.actualBoundingBoxAscent) &&
    Number.isFinite(m.actualBoundingBoxDescent)
  ) {
    return Math.max(
      base,
      Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 2)
    )
  }
  return base
}

/**
 * Bounding box in trim pixels (same rules as export draw).
 * When `softWrap` is false (`hug`), lines break only at newline characters.
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

  const fontSizePx = resolveTextLayerFontSizePx(layer)
  const fontFamily = resolveTextLayerFontFamily(layer)
  const lineHeight = textLineHeightTrimPx(layer)

  ctx.font = `${fontSizePx}px ${fontFamily}`
  const lines = buildDisplayLines(ctx, layer.text, wrapW, softWrap)

  let maxLineW = 0
  for (const line of lines) {
    maxLineW = Math.max(maxLineW, measureAdornedLineWidth(ctx, line))
  }

  const rawWidth = Math.ceil(
    Math.max(MIN_W_TRIM, maxLineW + (softWrap ? 0 : TEXT_HUG_WIDTH_PAD_PX))
  )
  const width = Math.ceil(Math.min(wrapW, rawWidth))

  let height: number
  if (softWrap) {
    height = Math.ceil(Math.max(MIN_H_TRIM, lines.length * lineHeight))
  } else {
    let totalLineH = 0
    for (const line of lines) {
      totalLineH += hugLineVisualHeightPx(ctx, layer, line)
    }
    height = Math.ceil(
      Math.max(MIN_H_TRIM, totalLineH + TEXT_HUG_HEIGHT_PAD_PX)
    )
  }

  return { width, height }
}
