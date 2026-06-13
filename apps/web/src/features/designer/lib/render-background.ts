import type { BackgroundSettings } from "@/features/designer/model/types"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load background image"))
    image.src = src
  })
}

export async function renderBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundSettings
): Promise<void> {
  if (background.type === "color" || !background.imageSrc) {
    context.fillStyle =
      background.type === "color" ? background.color : "#ffffff"
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
