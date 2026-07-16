/** Degrees → radians. */
export function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180
}

/** Radians → degrees. */
export function radToDeg(radians: number) {
  return (radians * 180) / Math.PI
}

/** Normalize to (-180, 180]. */
export function normalizeRotationDegrees(degrees: number) {
  if (!Number.isFinite(degrees)) {
    return 0
  }
  let d = degrees % 360
  if (d > 180) {
    d -= 360
  } else if (d <= -180) {
    d += 360
  }
  return d
}

/** Layer rotation in degrees (legacy layers default to 0). */
export function resolveLayerRotation(layer: { rotation?: number }) {
  const value = layer.rotation
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }
  return value
}

/**
 * Map a trim-space pointer into the layer's unrotated local frame so axis-aligned
 * resize math still works when the box is rotated around its center.
 */
export function worldPointerToUnrotatedTrim(
  wx: number,
  wy: number,
  box: { x: number; y: number; w: number; h: number },
  rotationDegrees: number
) {
  if (!rotationDegrees) {
    return { x: wx, y: wy }
  }
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const rad = degToRad(-rotationDegrees)
  const dx = wx - cx
  const dy = wy - cy
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
  return { x: cx + lx, y: cy + ly }
}

/** Angle in degrees from box center to a trim-space point. */
export function angleFromCenterDegrees(
  wx: number,
  wy: number,
  cx: number,
  cy: number
) {
  return radToDeg(Math.atan2(wy - cy, wx - cx))
}

const ROTATION_SNAP_DEG = 15

/** Apply Shift-snap to 15° increments when requested. */
export function maybeSnapRotationDegrees(degrees: number, snap: boolean) {
  if (!snap) {
    return normalizeRotationDegrees(degrees)
  }
  const snapped = Math.round(degrees / ROTATION_SNAP_DEG) * ROTATION_SNAP_DEG
  return normalizeRotationDegrees(snapped)
}
