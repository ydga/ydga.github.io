import type {
  CanvasSettings,
  GuideGeometry,
} from "@/features/designer/model/types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"

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
