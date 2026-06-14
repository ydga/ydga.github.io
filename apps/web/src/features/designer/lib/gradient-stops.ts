import type {
  BackgroundSettings,
  GradientStop,
} from "@/features/designer/model/types"

const MIN_STOP_GAP = 1

export function createGradientStopId(): string {
  return `gradient-stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function sortGradientStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.position - b.position)
}

export function normalizeGradientStops(stops: GradientStop[]): GradientStop[] {
  const sorted = sortGradientStops(stops)

  if (sorted.length < 2) {
    return [
      { id: createGradientStopId(), color: "#ffffff", position: 0 },
      { id: createGradientStopId(), color: "#000000", position: 100 },
    ]
  }

  return sorted.map((stop) => ({
    ...stop,
    position: clampStopPosition(stop.position),
  }))
}

export function normalizeBackgroundGradient(
  background: BackgroundSettings
): BackgroundSettings {
  let next: BackgroundSettings = { ...background }

  if (!next.gradientStops || next.gradientStops.length < 2) {
    next = {
      ...next,
      gradientStops: [
        { id: createGradientStopId(), color: next.color, position: 0 },
        {
          id: createGradientStopId(),
          color: next.gradientEnd ?? "#000000",
          position: 100,
        },
      ],
    }
  } else {
    next.gradientStops = normalizeGradientStops(next.gradientStops)
  }

  const hasAxis =
    Number.isFinite(next.gradientStartX) &&
    Number.isFinite(next.gradientStartY) &&
    Number.isFinite(next.gradientEndX) &&
    Number.isFinite(next.gradientEndY)

  if (!hasAxis) {
    const derived = deriveAxisFromAngle(next.gradientAngle ?? 180)
    next = { ...next, ...derived }
  } else {
    next = {
      ...next,
      gradientStartX: normalizeAxisPercent(next.gradientStartX),
      gradientStartY: normalizeAxisPercent(next.gradientStartY),
      gradientEndX: normalizeAxisPercent(next.gradientEndX),
      gradientEndY: normalizeAxisPercent(next.gradientEndY),
    }
  }

  next.gradientAngle = computeGradientAngleFromAxis(
    next.gradientStartX,
    next.gradientStartY,
    next.gradientEndX,
    next.gradientEndY
  )

  return next
}

export function computeGradientAngleFromAxis(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number {
  const radians = Math.atan2(endY - startY, endX - startX)

  return normalizeAngle(Math.round((radians * 180) / Math.PI + 90))
}

export function getStopCanvasPosition(
  stop: GradientStop,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stops: GradientStop[]
): { x: number; y: number } {
  const axisPercent = axisPercentFromStopPosition(stop.position, stops)
  const t = axisPercent / 100

  return {
    x: startX + (endX - startX) * t,
    y: startY + (endY - startY) * t,
  }
}

export function axisPercentFromStopPosition(
  position: number,
  stops: GradientStop[]
): number {
  const { startPosition, endPosition } = getGradientStopSpan(stops)
  const span = endPosition - startPosition

  if (span <= 0) {
    return 0
  }

  return clamp(((position - startPosition) / span) * 100, 0, 100)
}

export function stopPositionFromAxisPercent(
  axisPercent: number,
  stops: GradientStop[]
): number {
  const { startPosition, endPosition } = getGradientStopSpan(stops)
  const span = endPosition - startPosition

  if (span <= 0) {
    return startPosition
  }

  return startPosition + (clamp(axisPercent, 0, 100) / 100) * span
}

export function projectOntoGradientAxis(
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number {
  const dx = endX - startX
  const dy = endY - startY
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    return 0
  }

  const t = ((x - startX) * dx + (y - startY) * dy) / lengthSq

  return clamp(t * 100, 0, 100)
}

function deriveAxisFromAngle(angleDeg: number): {
  gradientStartX: number
  gradientStartY: number
  gradientEndX: number
  gradientEndY: number
} {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  const halfSpan = 35

  return {
    gradientStartX: normalizeAxisPercent(50 - Math.cos(angleRad) * halfSpan),
    gradientStartY: normalizeAxisPercent(50 - Math.sin(angleRad) * halfSpan),
    gradientEndX: normalizeAxisPercent(50 + Math.cos(angleRad) * halfSpan),
    gradientEndY: normalizeAxisPercent(50 + Math.sin(angleRad) * halfSpan),
  }
}

function normalizeAxisPercent(value: number): number {
  return clamp(value, 0, 100)
}

function normalizeAngle(value: number): number {
  const normalized = value % 360

  return normalized < 0 ? normalized + 360 : normalized
}

export function getGradientStopSpan(stops: GradientStop[]): {
  startPosition: number
  endPosition: number
} {
  const sorted = sortGradientStops(normalizeGradientStops(stops))

  return {
    startPosition: sorted[0]?.position ?? 0,
    endPosition: sorted[sorted.length - 1]?.position ?? 100,
  }
}

export function addGradientStop(stops: GradientStop[]): GradientStop[] {
  const sorted = sortGradientStops(normalizeGradientStops(stops))

  let insertAt = 50
  let largestGap = 0

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const gap = sorted[index + 1]!.position - sorted[index]!.position

    if (gap > largestGap) {
      largestGap = gap
      insertAt = (sorted[index]!.position + sorted[index + 1]!.position) / 2
    }
  }

  return addGradientStopAtPosition(stops, insertAt).stops
}

export function addGradientStopAtPosition(
  stops: GradientStop[],
  position: number
): { stops: GradientStop[]; stopId: string } {
  const stopId = createGradientStopId()
  const color = interpolateColorAtPosition(stops, position)
  const nextPosition = clampNewStopPosition(stops, position)

  return {
    stops: normalizeGradientStops([
      ...stops,
      {
        id: stopId,
        color,
        position: nextPosition,
      },
    ]),
    stopId,
  }
}

export function gradientStopsToCss(
  stops: GradientStop[],
  angleDeg: number
): string {
  const sorted = sortGradientStops(stops)
  const stopsCss = sorted
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ")

  return `linear-gradient(${angleDeg}deg, ${stopsCss})`
}

export function interpolateColorAtPosition(
  stops: GradientStop[],
  position: number
): string {
  const sorted = sortGradientStops(stops)
  const clamped = clampStopPosition(position)

  if (sorted.length === 0) {
    return "#808080"
  }

  if (clamped <= sorted[0]!.position) {
    return sorted[0]!.color
  }

  const last = sorted[sorted.length - 1]!
  if (clamped >= last.position) {
    return last.color
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index]!
    const end = sorted[index + 1]!

    if (clamped >= start.position && clamped <= end.position) {
      const range = end.position - start.position
      if (range <= 0) {
        return start.color
      }

      const ratio = (clamped - start.position) / range
      return mixHexColors(start.color, end.color, ratio)
    }
  }

  return last.color
}

export function clampNewStopPosition(
  stops: GradientStop[],
  position: number
): number {
  const sorted = sortGradientStops(stops)
  const clamped = clampStopPosition(position)

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index]!
    const end = sorted[index + 1]!

    if (clamped >= start.position && clamped <= end.position) {
      const min = start.position + MIN_STOP_GAP
      const max = end.position - MIN_STOP_GAP

      if (max < min) {
        return (start.position + end.position) / 2
      }

      return clamp(clamped, min, max)
    }
  }

  return clamped
}

export function clampStopPositionBetweenNeighbors(
  stops: GradientStop[],
  stopId: string,
  position: number
): number {
  const sorted = sortGradientStops(stops)
  const index = sorted.findIndex((stop) => stop.id === stopId)

  if (index === -1) {
    return clampStopPosition(position)
  }

  const min = index === 0 ? 0 : sorted[index - 1]!.position + MIN_STOP_GAP
  const max =
    index === sorted.length - 1
      ? 100
      : sorted[index + 1]!.position - MIN_STOP_GAP

  return clamp(position, min, max)
}

function clampStopPosition(position: number): number {
  return clamp(position, 0, 100)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function mixHexColors(start: string, end: string, ratio: number): string {
  const startRgb = parseHexColor(start)
  const endRgb = parseHexColor(end)

  if (!startRgb || !endRgb) {
    return start
  }

  const mix = (from: number, to: number) =>
    Math.round(from + (to - from) * ratio)

  return rgbToHex(
    mix(startRgb.r, endRgb.r),
    mix(startRgb.g, endRgb.g),
    mix(startRgb.b, endRgb.b)
  )
}

function parseHexColor(
  color: string
): { r: number; g: number; b: number } | null {
  const normalized = color.trim().replace("#", "")

  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0]! + normalized[0]!, 16)
    const g = Number.parseInt(normalized[1]! + normalized[1]!, 16)
    const b = Number.parseInt(normalized[2]! + normalized[2]!, 16)
    return { r, g, b }
  }

  if (normalized.length !== 6) {
    return null
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null
  }

  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    channel.toString(16).padStart(2, "0").toUpperCase()

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
