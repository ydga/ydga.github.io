function decimalPlaces(step: number) {
  const stepText = step.toString()
  if (!stepText.includes(".")) {
    return 0
  }

  return stepText.split(".")[1]?.length ?? 0
}

export function clampNumber(value: number, min?: number, max?: number) {
  let next = value
  if (min !== undefined) {
    next = Math.max(min, next)
  }
  if (max !== undefined) {
    next = Math.min(max, next)
  }
  return next
}

export function roundToStep(value: number, step: number) {
  if (step <= 0) {
    return value
  }

  const rounded = Math.round(value / step) * step
  return Number(rounded.toFixed(decimalPlaces(step)))
}

export function valueFromScrubDelta(
  startValue: number,
  deltaX: number,
  step: number,
  options?: {
    min?: number
    max?: number
    shiftKey?: boolean
    pixelsPerStep?: number
  }
) {
  const pixelsPerStep = options?.pixelsPerStep ?? (options?.shiftKey ? 10 : 1)
  const delta = (deltaX / pixelsPerStep) * step
  const next = roundToStep(startValue + delta, step)
  return clampNumber(next, options?.min, options?.max)
}
