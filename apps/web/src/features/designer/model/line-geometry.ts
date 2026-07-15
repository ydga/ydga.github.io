import type { ShapeLayer } from "@/features/designer/model/layers"

export type LinePoint = { x: number; y: number }

const MIN_EXTENT = 1

/** Relative points for a line; legacy layers without `points` use the box diagonal. */
export function resolveLinePoints(layer: ShapeLayer): LinePoint[] {
  if (layer.points && layer.points.length >= 2) {
    return layer.points.map((p) => ({ x: p.x, y: p.y }))
  }
  return [
    { x: 0, y: 0 },
    { x: layer.width, y: layer.height },
  ]
}

export function toAbsoluteLinePoints(
  layer: ShapeLayer,
  points: LinePoint[] = resolveLinePoints(layer)
): LinePoint[] {
  return points.map((p) => ({ x: layer.x + p.x, y: layer.y + p.y }))
}

export function boundsFromAbsolutePoints(points: LinePoint[]): {
  x: number
  y: number
  width: number
  height: number
  points: LinePoint[]
} {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(MIN_EXTENT, maxX - minX),
    height: Math.max(MIN_EXTENT, maxY - minY),
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
  }
}

/** Build line geometry from absolute start/end (placement). */
export function lineGeometryFromEndpoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  return boundsFromAbsolutePoints([
    { x: x0, y: y0 },
    { x: x1, y: y1 },
  ])
}

/**
 * With Shift: snap the end to horizontal, vertical, or 45° from the start.
 */
export function constrainLineEnd(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  shiftKey: boolean
): LinePoint {
  if (!shiftKey) {
    return { x: x1, y: y1 }
  }
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  if (dist < 1e-6) {
    return { x: x1, y: y1 }
  }
  const angle = Math.atan2(dy, dx)
  const snap = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return {
    x: x0 + dist * Math.cos(snap),
    y: y0 + dist * Math.sin(snap),
  }
}

export function clampPointToTrim(
  point: LinePoint,
  trimW: number,
  trimH: number
): LinePoint {
  return {
    x: Math.min(Math.max(point.x, 0), trimW),
    y: Math.min(Math.max(point.y, 0), trimH),
  }
}

/** Closest point on segment a→b to `p`, with t in [0, 1]. */
export function closestPointOnSegment(
  a: LinePoint,
  b: LinePoint,
  p: LinePoint
): { point: LinePoint; t: number; dist: number } {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  if (len2 < 1e-8) {
    const dist = Math.hypot(p.x - a.x, p.y - a.y)
    return { point: { ...a }, t: 0, dist }
  }
  const t = Math.min(
    1,
    Math.max(0, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2)
  )
  const point = { x: a.x + abx * t, y: a.y + aby * t }
  const dist = Math.hypot(p.x - point.x, p.y - point.y)
  return { point, t, dist }
}

/** Insert a point on the nearest segment (skips near endpoints). */
export function insertPointOnPolyline(
  absolutePoints: LinePoint[],
  click: LinePoint,
  endpointSkipT = 0.08
): LinePoint[] | null {
  if (absolutePoints.length < 2) {
    return null
  }

  let bestIndex = -1
  let best: { point: LinePoint; t: number; dist: number } | null = null

  for (let i = 0; i < absolutePoints.length - 1; i++) {
    const a = absolutePoints[i]!
    const b = absolutePoints[i + 1]!
    const hit = closestPointOnSegment(a, b, click)
    if (hit.t <= endpointSkipT || hit.t >= 1 - endpointSkipT) {
      continue
    }
    if (!best || hit.dist < best.dist) {
      best = hit
      bestIndex = i + 1
    }
  }

  if (bestIndex < 0 || !best) {
    return null
  }

  const next = [...absolutePoints]
  next.splice(bestIndex, 0, best.point)
  return next
}

export function syncLineLayerFromAbsolutePoints(
  layer: ShapeLayer,
  absolutePoints: LinePoint[]
): Pick<ShapeLayer, "x" | "y" | "width" | "height" | "points"> {
  return boundsFromAbsolutePoints(absolutePoints)
}
