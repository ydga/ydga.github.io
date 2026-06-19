import type { TextLayer } from "@/features/designer/model/layers"
import {
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
} from "@/features/designer/model/text-layer-style"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36

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

export function lineHeightPx(fontSizePx: number) {
  return Math.round(fontSizePx * 1.35)
}

/**
 * Bounding box in trim pixels that fits wrapped text (same rules as export draw).
 */
export function measureTextLayerContentBox(
  layer: TextLayer,
  maxWrapWidthPx: number
): { width: number; height: number } {
  const wrapW = Math.max(32, maxWrapWidthPx)

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
  const lineHeight = lineHeightPx(fontSizePx)

  ctx.font = `${fontSizePx}px ${fontFamily}`
  const lines = buildWrappedLines(ctx, layer.text, wrapW)

  let maxLineW = 0
  for (const line of lines) {
    const sample = line.length > 0 ? line : " "
    maxLineW = Math.max(maxLineW, ctx.measureText(sample).width)
  }

  const width = Math.ceil(Math.min(wrapW, Math.max(MIN_W_TRIM, maxLineW)))
  const height = Math.ceil(Math.max(MIN_H_TRIM, lines.length * lineHeight))

  return { width, height }
}
