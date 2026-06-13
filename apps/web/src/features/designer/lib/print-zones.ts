import type {
  CanvasSettings,
  GuideGeometry,
  GuideRect,
} from "@/features/designer/model/types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"

export type PreviewGuideGeometry = {
  trim: GuideRect
  bleed: GuideRect | null
  safe: GuideRect
  bleedPx: number
}

export function getGuideGeometry(settings: CanvasSettings): GuideGeometry {
  const {
    exportWidthPx,
    exportHeightPx,
    trimWidthPx,
    trimHeightPx,
    bleedPx,
    safeInsetPx,
  } = getExportDimensions(settings)

  const trim = {
    x: bleedPx,
    y: bleedPx,
    width: trimWidthPx,
    height: trimHeightPx,
  }

  const safe = {
    x: trim.x + safeInsetPx,
    y: trim.y + safeInsetPx,
    width: Math.max(trim.width - safeInsetPx * 2, 0),
    height: Math.max(trim.height - safeInsetPx * 2, 0),
  }

  return {
    exportWidthPx,
    exportHeightPx,
    trim,
    safe,
  }
}

/** Trim at the paper edge; bleed extends outside for canvas preview. */
export function getPreviewGuideGeometry(
  settings: CanvasSettings
): PreviewGuideGeometry {
  const { trimWidthPx, trimHeightPx, bleedPx, safeInsetPx } =
    getExportDimensions(settings)

  const trim = {
    x: 0,
    y: 0,
    width: trimWidthPx,
    height: trimHeightPx,
  }

  const bleed =
    bleedPx > 0
      ? {
          x: -bleedPx,
          y: -bleedPx,
          width: trimWidthPx + bleedPx * 2,
          height: trimHeightPx + bleedPx * 2,
        }
      : null

  const safe = {
    x: safeInsetPx,
    y: safeInsetPx,
    width: Math.max(trimWidthPx - safeInsetPx * 2, 0),
    height: Math.max(trimHeightPx - safeInsetPx * 2, 0),
  }

  return { trim, bleed, safe, bleedPx }
}
