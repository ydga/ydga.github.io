import type { ShapeLayer } from "@/features/designer/model/layers"
import { renderBackgroundInClip } from "@/features/designer/lib/render-background"
import {
  isShapeFillTransparent,
  resolveShapeLayerFillBackground,
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeWidth,
  resolveShapeLayerVisible,
} from "@/features/designer/model/shape-layer-style"

async function drawShapeOnContext(
  context: CanvasRenderingContext2D,
  layer: ShapeLayer,
  w: number,
  h: number
) {
  const fill = resolveShapeLayerFillBackground(layer)
  const stroke = resolveShapeLayerStroke(layer)
  const strokeWidth = resolveShapeLayerStrokeWidth(layer)
  const hasFill = !isShapeFillTransparent(layer)

  context.save()
  context.globalAlpha = resolveShapeLayerOpacity(layer)
  context.lineWidth = strokeWidth
  context.lineCap = "round"
  context.lineJoin = "round"

  switch (layer.shapeType) {
    case "square": {
      if (hasFill) {
        await renderBackgroundInClip(context, w, h, fill, () => {
          context.rect(0, 0, w, h)
        })
      }
      if (stroke !== "transparent" && strokeWidth > 0) {
        context.strokeStyle = stroke
        context.strokeRect(0, 0, w, h)
      }
      break
    }
    case "circle": {
      const cx = w / 2
      const cy = h / 2
      const rx = w / 2
      const ry = h / 2

      if (hasFill) {
        await renderBackgroundInClip(context, w, h, fill, () => {
          context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        })
      }
      if (stroke !== "transparent" && strokeWidth > 0) {
        context.beginPath()
        context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        context.strokeStyle = stroke
        context.stroke()
      }
      break
    }
    case "triangle": {
      if (hasFill) {
        await renderBackgroundInClip(context, w, h, fill, () => {
          context.moveTo(w / 2, 0)
          context.lineTo(w, h)
          context.lineTo(0, h)
          context.closePath()
        })
      }
      if (stroke !== "transparent" && strokeWidth > 0) {
        context.beginPath()
        context.moveTo(w / 2, 0)
        context.lineTo(w, h)
        context.lineTo(0, h)
        context.closePath()
        context.strokeStyle = stroke
        context.stroke()
      }
      break
    }
    case "line": {
      if (strokeWidth > 0) {
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(w, h)
        context.strokeStyle = stroke
        context.stroke()
      }
      break
    }
  }

  context.restore()
}

/**
 * Draws shape layers in trim coordinates. `trimOffsetPx` is the trim origin inside
 * the destination canvas (e.g. bleed inset on export-sized bitmaps).
 */
export async function drawShapeLayersOnContext(
  context: CanvasRenderingContext2D,
  layers: ShapeLayer[],
  trimOffsetPx: number
) {
  const ordered = [...layers].reverse()

  for (const layer of ordered) {
    if (!resolveShapeLayerVisible(layer)) {
      continue
    }

    context.save()
    context.translate(trimOffsetPx + layer.x, trimOffsetPx + layer.y)
    await drawShapeOnContext(context, layer, layer.width, layer.height)
    context.restore()
  }
}
