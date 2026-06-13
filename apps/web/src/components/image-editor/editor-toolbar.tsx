import { Download } from "lucide-react"

import { toPixelDimensions, type DimensionUnit } from "@/lib/canvas-units"
import { Button } from "@workspace/ui/components/button"

type EditorToolbarProps = {
  width: number
  height: number
  unit: DimensionUnit
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function EditorToolbar({
  width,
  height,
  unit,
  canvasRef,
}: EditorToolbarProps) {
  const { widthPx, heightPx } = toPixelDimensions(width, height, unit)

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const link = document.createElement("a")
    link.download = `image-${widthPx}x${heightPx}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div>
        <h1 className="font-heading text-lg font-medium">Image Studio</h1>
        <p className="text-sm text-muted-foreground">
          Create an image and download it as PNG.
        </p>
      </div>

      <Button onClick={handleDownload}>
        <Download data-icon="inline-start" />
        Download PNG
      </Button>
    </header>
  )
}
