import type { TextLayer } from "@/features/designer/model/layers"
import {
  buildDisplayLines,
  textLineHeightTrimPx,
} from "@/features/designer/lib/text-layer-layout"
import {
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerSizing,
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
    const lineHeight = textLineHeightTrimPx(layer)

    context.font = `${fontSizePx}px ${fontFamily}`
    context.fillStyle = fill

    const x = trimOffsetPx + layer.x
    const y = trimOffsetPx + layer.y
    const maxWidth = Math.max(32, layer.width)
    const clipH = Math.max(MIN_H_TRIM, layer.height)
    const softWrap = resolveTextLayerSizing(layer) === "fixed"
    const lines = buildDisplayLines(context, layer.text, maxWidth, softWrap)

    const clipPad = softWrap ? 0 : 3

    context.save()
    context.beginPath()
    context.rect(
      x - clipPad,
      y - clipPad,
      maxWidth + 2 * clipPad,
      clipH + 2 * clipPad
    )
    context.clip()

    lines.forEach((line, index) => {
      if (softWrap) {
        context.fillText(line, x, y + index * lineHeight, maxWidth)
      } else {
        context.fillText(line, x, y + index * lineHeight)
      }
    })

    context.restore()
  }

  context.restore()
}
