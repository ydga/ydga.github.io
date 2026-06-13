import {
  Blend,
  Image,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  Square,
} from "lucide-react"

import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import type {
  BackgroundFit,
  BackgroundType,
  CanvasSettings,
} from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { settingsFieldClasses } from "@workspace/ui/components/settings/settings-field-styles"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

type BackgroundSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
  onImageUpload: (file: File | null) => void
}

export function BackgroundSettingsSection({
  settings,
  dispatch,
  onImageUpload,
}: BackgroundSettingsSectionProps) {
  const { background } = settings

  return (
    <SettingSection title="Background">
      <div className="flex flex-col gap-3">
        <SettingControl label="Background type">
          <ToggleGroup
            type="single"
            variant="tile"
            size="icon"
            value={background.type}
            onValueChange={(value) => {
              if (isBackgroundType(value)) {
                dispatch({ type: "set-background-type", value })
              }
            }}
          >
            <ToggleGroupItem value="color" size="icon" aria-label="Solid color">
              <Palette className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="gradient" size="icon" aria-label="Gradient">
              <Blend className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="image" size="icon" aria-label="Image">
              <Image className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </SettingControl>

        {background.type === "color" ? (
          <ColorField
            label="Background color"
            value={background.color}
            onChange={(value) =>
              dispatch({ type: "set-background-color", value })
            }
          />
        ) : null}

        {background.type === "gradient" ? (
          <div className="flex flex-col gap-2">
            <ColorField
              label="Gradient start"
              value={background.color}
              onChange={(value) =>
                dispatch({ type: "set-background-color", value })
              }
            />
            <ColorField
              label="Gradient end"
              value={background.gradientEnd}
              onChange={(value) =>
                dispatch({ type: "set-background-gradient-end", value })
              }
            />
            <SettingControl label="Gradient angle">
              <div className="flex items-center gap-1.5">
                <SettingsInput
                  type="number"
                  min={0}
                  max={359}
                  step={1}
                  value={background.gradientAngle}
                  aria-label="Gradient angle"
                  className="h-7 w-16 font-mono tabular-nums"
                  onChange={(event) => {
                    const parsed = Number.parseFloat(event.target.value)
                    if (!Number.isNaN(parsed)) {
                      dispatch({
                        type: "set-background-gradient-angle",
                        value: parsed,
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">°</span>
              </div>
            </SettingControl>
          </div>
        ) : null}

        {background.type === "image" ? (
          <>
            <div className="flex flex-col gap-2">
              <SettingControl label="Upload image">
                <SettingsInput
                  type="file"
                  accept="image/*"
                  aria-label="Upload image"
                  className="h-7 max-w-full text-[10px] file:text-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    onImageUpload(file)
                  }}
                />
              </SettingControl>
              {background.imageSrc ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-fit text-xs"
                  onClick={() => onImageUpload(null)}
                >
                  Remove image
                </Button>
              ) : null}
            </div>

            <SettingControl label="Image fit">
              <ToggleGroup
                type="single"
                variant="tile"
                size="icon"
                value={background.fit}
                onValueChange={(value) => {
                  if (isBackgroundFit(value)) {
                    dispatch({ type: "set-background-fit", value })
                  }
                }}
              >
                <ToggleGroupItem value="cover" size="icon" aria-label="Cover">
                  <Maximize2 className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="contain"
                  size="icon"
                  aria-label="Contain"
                >
                  <Minimize2 className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="fit" size="icon" aria-label="Fit">
                  <Move className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="tile" size="icon" aria-label="Tile">
                  <Square className="size-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingControl>
          </>
        ) : null}
      </div>
    </SettingSection>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <SettingControl label={label}>
        <Input
          type="color"
          value={value}
          aria-label={label}
          className={settingsFieldClasses(
            "h-7 w-10 shrink-0 cursor-pointer p-0.5"
          )}
          onChange={(event) => onChange(event.target.value)}
        />
      </SettingControl>
      <SettingsInput
        type="text"
        value={value}
        aria-label={`${label} hex`}
        className="h-7 font-mono tabular-nums"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function isBackgroundType(value: string): value is BackgroundType {
  return value === "color" || value === "gradient" || value === "image"
}

function isBackgroundFit(value: string): value is BackgroundFit {
  return (
    value === "cover" ||
    value === "contain" ||
    value === "fit" ||
    value === "tile"
  )
}
