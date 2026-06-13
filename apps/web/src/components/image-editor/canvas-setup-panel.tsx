import type { CanvasPreset } from "@/lib/canvas-presets"
import {
  clampDimension,
  convertDimension,
  DEFAULT_DPI,
  pixelsToCm,
  toPixelDimensions,
  type DimensionUnit,
} from "@/lib/canvas-units"
import { CanvasPresetList } from "@/components/image-editor/canvas-preset-list"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

type CanvasSetupPanelProps = {
  width: number
  height: number
  unit: DimensionUnit
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onUnitChange: (unit: DimensionUnit) => void
  onPresetSelect: (preset: CanvasPreset) => void
}

export function CanvasSetupPanel({
  width,
  height,
  unit,
  onWidthChange,
  onHeightChange,
  onUnitChange,
  onPresetSelect,
}: CanvasSetupPanelProps) {
  const { widthPx, heightPx } = toPixelDimensions(width, height, unit)

  function handleUnitChange(nextUnit: DimensionUnit) {
    if (nextUnit === unit) {
      return
    }

    onWidthChange(convertDimension(width, unit, nextUnit))
    onHeightChange(convertDimension(height, unit, nextUnit))
    onUnitChange(nextUnit)
  }

  function handleWidthInput(value: string) {
    const parsed = Number.parseFloat(value)
    if (Number.isNaN(parsed)) {
      return
    }

    onWidthChange(clampDimension(parsed, unit))
  }

  function handleHeightInput(value: string) {
    const parsed = Number.parseFloat(value)
    if (Number.isNaN(parsed)) {
      return
    }

    onHeightChange(clampDimension(parsed, unit))
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-6 border-r border-border p-6">
      <div>
        <h2 className="font-heading text-base font-medium">Canvas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the size of your image before adding tools.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="canvas-unit">Unit</FieldLabel>
          <ToggleGroup
            id="canvas-unit"
            type="single"
            variant="outline"
            spacing={0}
            value={unit}
            onValueChange={(value) => {
              if (value === "px" || value === "cm") {
                handleUnitChange(value)
              }
            }}
          >
            <ToggleGroupItem value="px" className="min-w-16">
              PX
            </ToggleGroupItem>
            <ToggleGroupItem value="cm" className="min-w-16">
              CM
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="canvas-width">Width</FieldLabel>
          <Input
            id="canvas-width"
            type="number"
            min={unit === "px" ? 1 : 0.1}
            step={unit === "px" ? 1 : 0.1}
            value={width}
            onChange={(event) => handleWidthInput(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="canvas-height">Height</FieldLabel>
          <Input
            id="canvas-height"
            type="number"
            min={unit === "px" ? 1 : 0.1}
            step={unit === "px" ? 1 : 0.1}
            value={height}
            onChange={(event) => handleHeightInput(event.target.value)}
          />
        </Field>

        <FieldDescription>
          Export size: {widthPx} × {heightPx} px
          {unit === "cm" ? ` at ${DEFAULT_DPI} DPI` : null}
          {unit === "px"
            ? ` (${pixelsToCm(widthPx)} × ${pixelsToCm(heightPx)} cm at ${DEFAULT_DPI} DPI)`
            : null}
        </FieldDescription>

        <CanvasPresetList
          unit={unit}
          width={width}
          height={height}
          onPresetSelect={onPresetSelect}
        />
      </FieldGroup>

      <Separator />

      <div>
        <h3 className="text-sm font-medium">Tools</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Drawing and editing tools will appear here.
        </p>
        <Button variant="outline" className="mt-4 w-full" disabled>
          More tools coming soon
        </Button>
      </div>
    </aside>
  )
}
