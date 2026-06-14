function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type RgbColor = {
  r: number
  g: number
  b: number
}

export type HsvColor = {
  h: number
  s: number
  v: number
}

export function normalizeHexColor(color: string, fallback = "#000000"): string {
  const trimmed = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1)
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
  }

  return fallback
}

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHexColor(hex, "")
  if (!normalized) {
    return null
  }

  const value = normalized.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null
  }

  return { r, g, b }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0")

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function hexToHsv(hex: string): HsvColor {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return { h: 0, s: 0, v: 100 }
  }

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const s = max === 0 ? 0 : (delta / max) * 100
  const v = max * 100

  if (delta !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / delta + 2) * 60
        break
      default:
        h = ((r - g) / delta + 4) * 60
        break
    }
  }

  return { h, s, v }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const brightness = clamp(v, 0, 100) / 100

  const chroma = brightness * saturation
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const match = brightness - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (hue < 60) {
    red = chroma
    green = second
  } else if (hue < 120) {
    red = second
    green = chroma
  } else if (hue < 180) {
    green = chroma
    blue = second
  } else if (hue < 240) {
    green = second
    blue = chroma
  } else if (hue < 300) {
    red = second
    blue = chroma
  } else {
    red = chroma
    blue = second
  }

  return rgbToHex(
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255
  )
}
