import { useRef, useState } from "react"

import type { CanvasPreset } from "@/lib/canvas-presets"
import { clampDimension, type DimensionUnit } from "@/lib/canvas-units"
import { CanvasSetupPanel } from "@/components/image-editor/canvas-setup-panel"
import { EditorToolbar } from "@/components/image-editor/editor-toolbar"
import { ImageCanvasPreview } from "@/components/image-editor/image-canvas-preview"

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [unit, setUnit] = useState<DimensionUnit>("px")

  function handlePresetSelect(preset: CanvasPreset) {
    setUnit(preset.unit)
    setWidth(clampDimension(preset.width, preset.unit))
    setHeight(clampDimension(preset.height, preset.unit))
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <EditorToolbar
        width={width}
        height={height}
        unit={unit}
        canvasRef={canvasRef}
      />

      <div className="flex min-h-0 flex-1">
        <CanvasSetupPanel
          width={width}
          height={height}
          unit={unit}
          onWidthChange={(value) => setWidth(clampDimension(value, unit))}
          onHeightChange={(value) => setHeight(clampDimension(value, unit))}
          onUnitChange={setUnit}
          onPresetSelect={handlePresetSelect}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
          <ImageCanvasPreview
            width={width}
            height={height}
            unit={unit}
            canvasRef={canvasRef}
          />
        </main>
      </div>
    </div>
  )
}
