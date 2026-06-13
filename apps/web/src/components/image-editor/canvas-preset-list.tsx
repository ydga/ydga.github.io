import {
  getPresetsForUnit,
  isPresetActive,
  type CanvasPreset,
} from "@/lib/canvas-presets"
import type { DimensionUnit } from "@/lib/canvas-units"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type CanvasPresetListProps = {
  unit: DimensionUnit
  width: number
  height: number
  onPresetSelect: (preset: CanvasPreset) => void
}

export function CanvasPresetList({
  unit,
  width,
  height,
  onPresetSelect,
}: CanvasPresetListProps) {
  const presets = getPresetsForUnit(unit)
  const heading = unit === "px" ? "Instagram sizes" : "Print sizes"

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{heading}</p>
      <div className="flex flex-col gap-1.5">
        {presets.map((preset) => {
          const active = isPresetActive(preset, width, height, unit)

          return (
            <Button
              key={preset.id}
              type="button"
              variant={active ? "secondary" : "outline"}
              className={cn(
                "h-auto w-full justify-between px-3 py-2",
                active && "ring-1 ring-ring"
              )}
              onClick={() => onPresetSelect(preset)}
            >
              <span className="text-left text-sm font-medium">
                {preset.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
