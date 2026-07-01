import type { Layer } from "@/features/designer/model/layers"
import { resolveShapeLayerVisible } from "@/features/designer/model/shape-layer-style"
import { resolveTextLayerVisible } from "@/features/designer/model/text-layer-style"
import type { CanvasSettings } from "@/features/designer/model/types"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"

/** Trim-space distance within which a box edge or center snaps to a guide. */
export const SNAP_THRESHOLD_TRIM_PX = 6

export type SnapGuideLines = {
  xs: number[]
  ys: number[]
}

export type ActiveSnapGuideLines = SnapGuideLines

export type SnapLayerBoxResult = {
  x: number
  y: number
  w: number
  h: number
  activeGuideXs: number[]
  activeGuideYs: number[]
}

export function guideSnapActiveForText(settings: CanvasSettings): boolean {
  const { guides, print } = settings
  return (
    guides.showTrim ||
    guides.showCenter ||
    guides.showThirds ||
    (guides.showSafe && print.safeEnabled && isPrintDocument(settings))
  )
}

function isLayerVisibleForSnap(layer: Layer): boolean {
  if (layer.kind === "text") {
    return resolveTextLayerVisible(layer)
  }

  if (layer.kind === "shape") {
    return resolveShapeLayerVisible(layer)
  }

  return false
}

function appendLayerSnapTargets(
  xs: Set<number>,
  ys: Set<number>,
  layer: Layer
): void {
  const { x, y, width, height } = layer
  xs.add(x)
  xs.add(x + width)
  xs.add(x + width / 2)
  ys.add(y)
  ys.add(y + height)
  ys.add(y + height / 2)
}

/**
 * Vertical and horizontal guide positions in trim px (same space as text layers).
 * Includes trim edges; adds center, thirds, and safe edges when those guides are on.
 */
export function buildSnapGuideLinesTrimPx(
  settings: CanvasSettings,
  trimWidthPx: number,
  trimHeightPx: number
): SnapGuideLines {
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
 * Smart snap targets while dragging: frame edges/center, other layers, and optional
 * preview guides when those are enabled in settings.
 */
export function buildDragSnapGuideLines(
  settings: CanvasSettings,
  trimWidthPx: number,
  trimHeightPx: number,
  layers: readonly Layer[],
  excludeLayerId: string | null
): SnapGuideLines {
  const xs = new Set<number>()
  const ys = new Set<number>()

  xs.add(0)
  xs.add(trimWidthPx)
  ys.add(0)
  ys.add(trimHeightPx)
  xs.add(trimWidthPx / 2)
  ys.add(trimHeightPx / 2)

  if (guideSnapActiveForText(settings)) {
    const canvas = buildSnapGuideLinesTrimPx(settings, trimWidthPx, trimHeightPx)
    for (const x of canvas.xs) {
      xs.add(x)
    }
    for (const y of canvas.ys) {
      ys.add(y)
    }
  }

  for (const layer of layers) {
    if (layer.id === excludeLayerId) {
      continue
    }
    if (!isLayerVisibleForSnap(layer)) {
      continue
    }
    appendLayerSnapTargets(xs, ys, layer)
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
  return snapBoxAxisTrimPxWithActive(
    pos,
    size,
    guides,
    threshold,
    minPos,
    maxRight
  ).pos
}

export function snapBoxAxisTrimPxWithActive(
  pos: number,
  size: number,
  guides: readonly number[],
  threshold: number,
  minPos: number,
  maxRight: number
): { pos: number; activeGuide: number | null } {
  if (guides.length === 0 || !Number.isFinite(size) || size <= 0) {
    return { pos, activeGuide: null }
  }

  let bestPos = pos
  let bestDist = threshold
  let activeGuide: number | null = null

  for (const g of guides) {
    for (const posPrime of [g, g - size, g - size / 2]) {
      if (posPrime < minPos || posPrime + size > maxRight) {
        continue
      }
      const dist = Math.abs(pos - posPrime)
      if (dist < bestDist) {
        bestDist = dist
        bestPos = posPrime
        activeGuide = g
      }
    }
  }

  return { pos: bestPos, activeGuide }
}

export function snapLayerBoxTrimPx(
  x: number,
  y: number,
  w: number,
  h: number,
  guidesX: readonly number[],
  guidesY: readonly number[],
  threshold: number,
  trimW: number,
  trimH: number
): SnapLayerBoxResult {
  const xSnap = snapBoxAxisTrimPxWithActive(x, w, guidesX, threshold, 0, trimW)
  const ySnap = snapBoxAxisTrimPxWithActive(y, h, guidesY, threshold, 0, trimH)

  return {
    x: xSnap.pos,
    y: ySnap.pos,
    w,
    h,
    activeGuideXs: xSnap.activeGuide != null ? [xSnap.activeGuide] : [],
    activeGuideYs: ySnap.activeGuide != null ? [ySnap.activeGuide] : [],
  }
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
  const snapped = snapLayerBoxTrimPx(
    x,
    y,
    w,
    h,
    guidesX,
    guidesY,
    threshold,
    trimW,
    trimH
  )

  return {
    x: snapped.x,
    y: snapped.y,
    w: snapped.w,
    h: snapped.h,
  }
}
