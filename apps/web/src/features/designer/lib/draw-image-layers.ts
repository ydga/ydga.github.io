import type { ImageLayer } from "@/features/designer/model/layers"
import { renderBackgroundInRect } from "@/features/designer/lib/render-background"
import {
  imageLayerHasImage,
  resolveImageLayerFill,
  resolveImageLayerOpacity,
  resolveImageLayerVisible,
} from "@/features/designer/model/image-layer-style"

async function drawImageOnContext(
  context: CanvasRenderingContext2D,
  layer: ImageLayer,
  w: number,
  h: number
) {
  if (!imageLayerHasImage(layer)) {
    return
  }

  const fill = resolveImageLayerFill(layer)

  context.save()
  context.globalAlpha = resolveImageLayerOpacity(layer)
  await renderBackgroundInRect(context, 0, 0, w, h, fill)
  context.restore()
}

export async function drawImageLayersOnContext(
  context: CanvasRenderingContext2D,
  layers: ImageLayer[],
  trimOffsetPx: number
) {
  const ordered = [...layers].reverse()

  for (const layer of ordered) {
    if (!resolveImageLayerVisible(layer)) {
      continue
    }

    context.save()
    context.translate(trimOffsetPx + layer.x, trimOffsetPx + layer.y)
    await drawImageOnContext(context, layer, layer.width, layer.height)
    context.restore()
  }
}
