import { useState } from "react"

import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import {
  getPresetsForUnit,
  isPresetActive,
  type CanvasPreset,
} from "@/features/designer/model/presets"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

type CanvasSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function CanvasSettingsSection({
  settings,
  dispatch,
}: CanvasSettingsSectionProps) {
  const { width, height, unit, dpi, pixelScale } = settings
  const [squareOrientation, setSquareOrientation] = useState<
    "portrait" | "landscape"
  >("portrait")

  const orientationValue =
    width === height
      ? squareOrientation
      : width > height
        ? "landscape"
        : "portrait"

  function handleOrientationChange(next: "portrait" | "landscape") {
    if (width === height) {
      setSquareOrientation(next)
      return
    }

    const current = width > height ? "landscape" : "portrait"
    if (next !== current) {
      dispatch({ type: "rotate-orientation" })
    }
  }

  function handleUnitChange(nextUnit: CanvasSettings["unit"]) {
    dispatch({ type: "set-unit", value: nextUnit })
  }

  return (
    <SettingsSection
      title="Canvas"
      description="Trim size and export scaling for your design."
    >
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
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value)
              if (!Number.isNaN(parsed)) {
                dispatch({ type: "set-width", value: parsed })
              }
            }}
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
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value)
              if (!Number.isNaN(parsed)) {
                dispatch({ type: "set-height", value: parsed })
              }
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="canvas-orientation">Orientation</FieldLabel>
          <ToggleGroup
            id="canvas-orientation"
            type="single"
            variant="outline"
            spacing={0}
            value={orientationValue}
            onValueChange={(value) => {
              if (value === "portrait" || value === "landscape") {
                handleOrientationChange(value)
              }
            }}
          >
            <ToggleGroupItem value="portrait" className="min-w-16">
              Portrait
            </ToggleGroupItem>
            <ToggleGroupItem value="landscape" className="min-w-16">
              Landscape
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {unit === "px" ? (
          <Field>
            <FieldLabel htmlFor="canvas-scale">Scale</FieldLabel>
            <ToggleGroup
              id="canvas-scale"
              type="single"
              variant="outline"
              spacing={0}
              value={String(pixelScale)}
              onValueChange={(value) => {
                if (value === "1" || value === "2") {
                  dispatch({
                    type: "set-pixel-scale",
                    value: Number(value) as 1 | 2,
                  })
                }
              }}
            >
              <ToggleGroupItem value="1" className="min-w-16">
                1×
              </ToggleGroupItem>
              <ToggleGroupItem value="2" className="min-w-16">
                2×
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="canvas-dpi">DPI</FieldLabel>
            <ToggleGroup
              id="canvas-dpi"
              type="single"
              variant="outline"
              spacing={0}
              value={String(dpi)}
              onValueChange={(value) => {
                const nextDpi = Number(value)
                if ([300, 260, 220, 172].includes(nextDpi)) {
                  dispatch({
                    type: "set-dpi",
                    value: nextDpi as CanvasSettings["dpi"],
                  })
                }
              }}
            >
              {[300, 260, 220, 172].map((option) => (
                <ToggleGroupItem
                  key={option}
                  value={String(option)}
                  className="min-w-12"
                >
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        )}
      </FieldGroup>
    </SettingsSection>
  )
}

export function PresetsSection({
  settings,
  dispatch,
}: CanvasSettingsSectionProps) {
  const presets = getPresetsForUnit(settings.unit)
  const heading = settings.unit === "px" ? "Instagram sizes" : "Print sizes"

  return (
    <SettingsSection title="Presets" description={heading}>
      <div className="flex flex-col gap-1.5">
        {presets.map((preset) => {
          const active = isPresetActive(
            preset,
            settings.width,
            settings.height,
            settings.unit
          )

          return (
            <PresetButton
              key={preset.id}
              preset={preset}
              active={active}
              onSelect={() => dispatch({ type: "apply-preset", preset })}
            />
          )
        })}
      </div>
    </SettingsSection>
  )
}

function PresetButton({
  preset,
  active,
  onSelect,
}: {
  preset: CanvasPreset
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-auto w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-ring bg-muted ring-1 ring-ring"
          : "border-border bg-background hover:bg-muted/50"
      }`}
    >
      <span className="font-medium">{preset.label}</span>
      <span className="text-xs text-muted-foreground">
        {preset.description}
      </span>
    </button>
  )
}
