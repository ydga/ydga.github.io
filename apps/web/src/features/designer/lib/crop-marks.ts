import { isPrintDocument } from "@/features/designer/lib/document-intent"
import type { CanvasSettings, GuideRect } from "@/features/designer/model/types"

/** Gap between trim corner and start of crop mark (ISO-style press layout). */
const CROP_MARK_GAP_MM = 1
/** Length of each crop mark leg extending into the bleed area. */
const CROP_MARK_LENGTH_MM = 5

const SCREEN_CROP_MARK_GAP_PX = 4
const SCREEN_CROP_MARK_LENGTH_PX = 12

export type CropMarkSpec = {
  gap: number
  length: number
}

export type CropMarkLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function getCropMarkSpec(
  settings: CanvasSettings,
  bleedPx: number
): CropMarkSpec {
  if (isPrintDocument(settings)) {
    const gap = (CROP_MARK_GAP_MM * settings.dpi) / 25.4
    const length = (CROP_MARK_LENGTH_MM * settings.dpi) / 25.4
    const outwardSpace = Math.max(bleedPx - gap, 0)

    return {
      gap,
      length: outwardSpace > 0 ? Math.min(length, outwardSpace) : length,
    }
  }

  return {
    gap: SCREEN_CROP_MARK_GAP_PX,
    length: SCREEN_CROP_MARK_LENGTH_PX,
  }
}

/** Corner crop marks aligned to trim edges, extending outward into bleed. */
export function getCropMarkLines(
  trim: GuideRect,
  spec: CropMarkSpec
): CropMarkLine[] {
  const { x, y, width, height } = trim
  const { gap, length } = spec
  const right = x + width
  const bottom = y + height

  return [
    { x1: x, y1: y - gap - length, x2: x, y2: y - gap },
    { x1: x - gap - length, y1: y, x2: x - gap, y2: y },
    { x1: right, y1: y - gap - length, x2: right, y2: y - gap },
    { x1: right + gap, y1: y, x2: right + gap + length, y2: y },
    { x1: x, y1: bottom + gap, x2: x, y2: bottom + gap + length },
    { x1: x - gap - length, y1: bottom, x2: x - gap, y2: bottom },
    { x1: right, y1: bottom + gap, x2: right, y2: bottom + gap + length },
    { x1: right + gap, y1: bottom, x2: right + gap + length, y2: bottom },
  ]
}
