import type { CanvasSettings } from "@/features/designer/model/types"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"

/** Trim-space distance within which a box edge or center snaps to a guide. */
export const SNAP_THRESHOLD_TRIM_PX = 6

export function guideSnapActiveForText(settings: CanvasSettings): boolean {
  const { guides, print } = settings
  return (
    guides.showTrim ||
    guides.showCenter ||
    guides.showThirds ||
    (guides.showSafe && print.safeEnabled && isPrintDocument(settings))
  )
}

/**
 * Vertical and horizontal guide positions in trim px (same space as text layers).
 * Includes trim edges; adds center, thirds, and safe edges when those guides are on.
 */
export function buildSnapGuideLinesTrimPx(
  settings: CanvasSettings,
  trimWidthPx: number,
  trimHeightPx: number
): { xs: number[]; ys: number[] } {
  const { guides, print } = settings
  const { safe } = getPreviewGuideGeometry(settings)
  const showPrintGuides = isPrintDocument(settings)

  const xs = new Set<number>()
  const ys = new Set<number>()

  xs.add(0)
  xs.add(trimWidthPx)
  ys.add(0)
  ys.add(trimHeightPx)

  if (guides.showCenter) {
    xs.add(trimWidthPx / 2)
    ys.add(trimHeightPx / 2)
  }
  if (guides.showThirds) {
    xs.add(trimWidthPx / 3)
    xs.add((2 * trimWidthPx) / 3)
    ys.add(trimHeightPx / 3)
    ys.add((2 * trimHeightPx) / 3)
  }
  if (guides.showSafe && print.safeEnabled && showPrintGuides) {
    xs.add(safe.x)
    xs.add(safe.x + safe.width)
    ys.add(safe.y)
    ys.add(safe.y + safe.height)
  }

  return {
    xs: [...xs].sort((a, b) => a - b),
    ys: [...ys].sort((a, b) => a - b),
  }
}

/**
 * Snap one axis so the interval `[pos, pos + size]` aligns its left edge, right edge,
 * or midpoint to the nearest guide within `threshold`.
 */
export function snapBoxAxisTrimPx(
  pos: number,
  size: number,
  guides: readonly number[],
  threshold: number,
  minPos: number,
  maxRight: number
): number {
  if (guides.length === 0 || !Number.isFinite(size) || size <= 0) {
    return pos
  }

  let bestPos = pos
  let bestDist = threshold

  for (const g of guides) {
    for (const posPrime of [g, g - size, g - size / 2]) {
      if (posPrime < minPos || posPrime + size > maxRight) {
        continue
      }
      const dist = Math.abs(pos - posPrime)
      if (dist < bestDist) {
        bestDist = dist
        bestPos = posPrime
      }
    }
  }

  return bestPos
}

export function snapTextLayerBoxTrimPx(
  x: number,
  y: number,
  w: number,
  h: number,
  guidesX: readonly number[],
  guidesY: readonly number[],
  threshold: number,
  trimW: number,
  trimH: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: snapBoxAxisTrimPx(x, w, guidesX, threshold, 0, trimW),
    y: snapBoxAxisTrimPx(y, h, guidesY, threshold, 0, trimH),
    w,
    h,
  }
}
