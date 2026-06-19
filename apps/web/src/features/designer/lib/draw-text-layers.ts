import type { TextLayer } from "@/features/designer/model/layers"
import {
  buildDisplayLines,
  lineAdvanceTrimPx,
  textLayerTextBlockHeightTrimPx,
  verticalTextOffsetTrimPx,
} from "@/features/designer/lib/text-layer-layout"
import {
  resolveTextLayerClip,
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerSizing,
  resolveTextLayerStrikethrough,
  resolveTextLayerTextAlign,
  resolveTextLayerUnderline,
  resolveTextLayerVerticalAlign,
} from "@/features/designer/model/text-layer-style"

const MIN_H_TRIM = 36

function lineDecorationSpanTrimPx(
  context: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
  softWrap: boolean
): number {
  const m = context.measureText(line)
  const raw = m.width
  if (!softWrap) {
    return raw
  }
  return Math.min(raw, maxWidth)
}

function drawLineTextDecorationsTrim(
  context: CanvasRenderingContext2D,
  opts: {
    line: string
    lineY: number
    fontSizePx: number
    textAlign: CanvasTextAlign
    alignX: number
    maxWidth: number
    softWrap: boolean
    underline: boolean
    strikethrough: boolean
  }
) {
  const {
    line,
    lineY,
    fontSizePx,
    textAlign,
    alignX,
    maxWidth,
    softWrap,
    underline,
    strikethrough,
  } = opts
  if (!underline && !strikethrough) {
    return
  }

  const w = lineDecorationSpanTrimPx(context, line, maxWidth, softWrap)
  let x0: number
  if (textAlign === "center") {
    x0 = alignX - w / 2
  } else if (textAlign === "right") {
    x0 = alignX - w
  } else {
    x0 = alignX
  }

  const m = context.measureText(line.length > 0 ? line : " ")
  const ascent = m.fontBoundingBoxAscent ?? fontSizePx * 0.72
  const descent = m.fontBoundingBoxDescent ?? fontSizePx * 0.22
  const underlineY = lineY + ascent + Math.max(1, descent * 0.35)
  const strikeY = lineY + ascent * 0.45

  context.save()
  context.strokeStyle = context.fillStyle
  context.lineWidth = Math.max(1, fontSizePx / 14)
  context.lineCap = "round"
  if (underline) {
    context.beginPath()
    context.moveTo(x0, underlineY)
    context.lineTo(x0 + w, underlineY)
    context.stroke()
  }
  if (strikethrough) {
    context.beginPath()
    context.moveTo(x0, strikeY)
    context.lineTo(x0 + w, strikeY)
    context.stroke()
  }
  context.restore()
}

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

    context.font = `${fontSizePx}px ${fontFamily}`
    context.fillStyle = fill

    const x = trimOffsetPx + layer.x
    const y = trimOffsetPx + layer.y
    const maxWidth = Math.max(32, layer.width)
    const clipH = Math.max(MIN_H_TRIM, layer.height)
    const softWrap = resolveTextLayerSizing(layer) === "fixed"
    const shouldClip = resolveTextLayerClip(layer)
    const textAlign = resolveTextLayerTextAlign(layer)
    const verticalAlign = resolveTextLayerVerticalAlign(layer)
    const underline = resolveTextLayerUnderline(layer)
    const strikethrough = resolveTextLayerStrikethrough(layer)
    const lines = buildDisplayLines(context, layer.text, maxWidth, softWrap)

    const clipPad = softWrap ? 0 : 3

    context.save()
    if (shouldClip) {
      context.beginPath()
      context.rect(
        x - clipPad,
        y - clipPad,
        maxWidth + 2 * clipPad,
        clipH + 2 * clipPad
      )
      context.clip()
    }

    context.textAlign = textAlign
    const alignX =
      textAlign === "center"
        ? x + maxWidth / 2
        : textAlign === "right"
          ? x + maxWidth
          : x

    const verticalOffset = verticalTextOffsetTrimPx(
      clipH,
      textLayerTextBlockHeightTrimPx(context, layer, maxWidth, softWrap),
      verticalAlign
    )
    const yStart = y + verticalOffset

    let lineY = yStart
    for (const line of lines) {
      if (softWrap) {
        context.fillText(line, alignX, lineY, maxWidth)
      } else {
        context.fillText(line, alignX, lineY)
      }
      drawLineTextDecorationsTrim(context, {
        line,
        lineY,
        fontSizePx,
        textAlign,
        alignX,
        maxWidth,
        softWrap,
        underline,
        strikethrough,
      })
      lineY += lineAdvanceTrimPx(context, layer, line, softWrap)
    }

    context.restore()
  }

  context.restore()
}
