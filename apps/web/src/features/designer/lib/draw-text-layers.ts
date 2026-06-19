import type { TextLayer } from "@/features/designer/model/layers"
import {
  buildWrappedLines,
  lineHeightPx,
} from "@/features/designer/lib/text-layer-layout"
import {
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
} from "@/features/designer/model/text-layer-style"

const MIN_H_TRIM = 36

/**
 * Draws text layers in trim coordinates. `trimOffsetPx` is the trim origin inside
 * the destination canvas (e.g. bleed inset on export-sized bitmaps).
 */
export function drawTextLayersOnContext(
  context: CanvasRenderingContext2D,
  layers: TextLayer[],
  trimOffsetPx: number
) {
  context.save()
  context.textBaseline = "top"

  const ordered = [...layers].reverse()

  for (const layer of ordered) {
    const fontSizePx = resolveTextLayerFontSizePx(layer)
    const fontFamily = resolveTextLayerFontFamily(layer)
    const fill = resolveTextLayerColor(layer)
    const lineHeight = lineHeightPx(fontSizePx)

    context.font = `${fontSizePx}px ${fontFamily}`
    context.fillStyle = fill

    const x = trimOffsetPx + layer.x
    const y = trimOffsetPx + layer.y
    const maxWidth = Math.max(32, layer.width)
    const clipH = Math.max(MIN_H_TRIM, layer.height)
    const lines = buildWrappedLines(context, layer.text, maxWidth)

    context.save()
    context.beginPath()
    context.rect(x, y, maxWidth, clipH)
    context.clip()

    lines.forEach((line, index) => {
      context.fillText(line, x, y + index * lineHeight, maxWidth)
    })

    context.restore()
  }

  context.restore()
}
