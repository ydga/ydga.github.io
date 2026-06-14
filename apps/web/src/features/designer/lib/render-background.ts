import type {
  BackgroundSettings,
  CanvasSettings,
} from "@/features/designer/model/types"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import {
  normalizeBackgroundGradient,
  sortGradientStops,
} from "@/features/designer/lib/gradient-stops"

export function shouldShowBleedPreview(settings: CanvasSettings): boolean {
  if (!settings.guides.showBleed) {
    return false
  }

  return getExportDimensions(settings).bleedPx > 0
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load background image"))
    image.src = src
  })
}

function renderLinearGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: BackgroundSettings["gradientStops"],
  background: BackgroundSettings
) {
  const sorted = sortGradientStops(stops)
  const x0 = (background.gradientStartX / 100) * width
  const y0 = (background.gradientStartY / 100) * height
  const x1 = (background.gradientEndX / 100) * width
  const y1 = (background.gradientEndY / 100) * height

  const gradient = context.createLinearGradient(x0, y0, x1, y1)
  const startT = sorted[0]?.position / 100 ?? 0
  const endT = sorted[sorted.length - 1]?.position / 100 ?? 1
  const span = endT - startT

  if (span <= 0) {
    gradient.addColorStop(0, sorted[0]?.color ?? "#000000")
  } else {
    for (const stop of sorted) {
      const position = (stop.position / 100 - startT) / span
      gradient.addColorStop(Math.min(1, Math.max(0, position)), stop.color)
    }
  }

  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

export async function renderBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundSettings
): Promise<void> {
  if (background.type === "transparent") {
    context.clearRect(0, 0, width, height)
    return
  }

  if (background.type === "color") {
    context.fillStyle = background.color
    context.fillRect(0, 0, width, height)
    return
  }

  if (background.type === "gradient") {
    const normalized = normalizeBackgroundGradient(background)
    renderLinearGradient(
      context,
      width,
      height,
      normalized.gradientStops,
      normalized
    )
    return
  }

  if (!background.imageSrc) {
    context.fillStyle = background.color
    context.fillRect(0, 0, width, height)
    return
  }

  const image = await loadImage(background.imageSrc)

  switch (background.fit) {
    case "fit":
      context.drawImage(image, 0, 0, width, height)
      return
    case "tile": {
      const pattern = context.createPattern(image, "repeat")
      if (pattern) {
        context.fillStyle = pattern
        context.fillRect(0, 0, width, height)
      }
      return
    }
    case "contain": {
      const scale = Math.min(width / image.width, height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      context.fillStyle = background.color
      context.fillRect(0, 0, width, height)
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight
      )
      return
    }
    case "cover":
    default: {
      const scale = Math.max(width / image.width, height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight
      )
    }
  }
}

export function getBackgroundFallbackColor(background: BackgroundSettings) {
  if (background.type === "transparent") {
    return null
  }

  return background.color
}

export function paintBackgroundFallback(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundSettings
) {
  if (background.type === "transparent") {
    context.clearRect(0, 0, width, height)
    return
  }

  context.fillStyle = getBackgroundFallbackColor(background) ?? "#ffffff"
  context.fillRect(0, 0, width, height)
}

export async function renderPreviewCanvasBackground(
  context: CanvasRenderingContext2D,
  settings: CanvasSettings
): Promise<void> {
  const { exportWidthPx, exportHeightPx } = getExportDimensions(settings)

  await renderBackground(
    context,
    exportWidthPx,
    exportHeightPx,
    settings.background
  )
}

export async function renderTrimPreviewBackground(
  context: CanvasRenderingContext2D,
  settings: CanvasSettings
): Promise<void> {
  const { trimWidthPx, trimHeightPx } = getExportDimensions(settings)

  await renderBackground(
    context,
    trimWidthPx,
    trimHeightPx,
    settings.background
  )
}

export async function renderExportBackground(
  context: CanvasRenderingContext2D,
  settings: CanvasSettings
): Promise<void> {
  const { exportWidthPx, exportHeightPx } = getExportDimensions(settings)

  await renderBackground(
    context,
    exportWidthPx,
    exportHeightPx,
    settings.background
  )
}
