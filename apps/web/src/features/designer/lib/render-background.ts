import type { BackgroundSettings } from "@/features/designer/model/types"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load background image"))
    image.src = src
  })
}

function getLinearGradientPoints(
  width: number,
  height: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  const centerX = width / 2
  const centerY = height / 2
  const length =
    Math.abs(width * Math.sin(angleRad)) + Math.abs(height * Math.cos(angleRad))

  return {
    x0: centerX - (Math.cos(angleRad) * length) / 2,
    y0: centerY - (Math.sin(angleRad) * length) / 2,
    x1: centerX + (Math.cos(angleRad) * length) / 2,
    y1: centerY + (Math.sin(angleRad) * length) / 2,
  }
}

function renderLinearGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  startColor: string,
  endColor: string,
  angleDeg: number
) {
  const { x0, y0, x1, y1 } = getLinearGradientPoints(width, height, angleDeg)
  const gradient = context.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

export async function renderBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundSettings
): Promise<void> {
  if (background.type === "color") {
    context.fillStyle = background.color
    context.fillRect(0, 0, width, height)
    return
  }

  if (background.type === "gradient") {
    renderLinearGradient(
      context,
      width,
      height,
      background.color,
      background.gradientEnd,
      background.gradientAngle
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
  return background.color
}
