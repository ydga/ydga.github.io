import { useEffect, useRef } from "react"

import {
  getPreviewScale,
  toPixelDimensions,
  type DimensionUnit,
} from "@/lib/canvas-units"

type ImageCanvasPreviewProps = {
  width: number
  height: number
  unit: DimensionUnit
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ImageCanvasPreview({
  width,
  height,
  unit,
  canvasRef,
}: ImageCanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { widthPx, heightPx } = toPixelDimensions(width, height, unit)
  const previewScale = getPreviewScale(widthPx, heightPx)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    canvas.width = widthPx
    canvas.height = heightPx

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, widthPx, heightPx)
  }, [canvasRef, heightPx, widthPx])

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-2xl bg-muted/40 p-8"
    >
      <div
        className="relative shadow-lg ring-1 ring-foreground/10"
        style={{
          width: widthPx * previewScale,
          height: heightPx * previewScale,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block origin-top-left bg-white"
          style={{
            width: widthPx * previewScale,
            height: heightPx * previewScale,
          }}
        />
      </div>
    </div>
  )
}
