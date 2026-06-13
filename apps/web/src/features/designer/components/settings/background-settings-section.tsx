import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type {
  BackgroundFit,
  CanvasSettings,
} from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
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
    <SettingsSection
      title="Background"
      description="Solid color or image fill for the full export area."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="background-type">Type</FieldLabel>
          <ToggleGroup
            id="background-type"
            type="single"
            variant="outline"
            spacing={0}
            value={background.type}
            onValueChange={(value) => {
              if (value === "color" || value === "image") {
                dispatch({ type: "set-background-type", value })
              }
            }}
          >
            <ToggleGroupItem value="color" className="min-w-16">
              Color
            </ToggleGroupItem>
            <ToggleGroupItem value="image" className="min-w-16">
              Image
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {background.type === "color" ? (
          <Field>
            <FieldLabel htmlFor="background-color">Color</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="background-color"
                type="color"
                value={background.color}
                className="h-9 w-14 shrink-0 cursor-pointer p-1"
                onChange={(event) =>
                  dispatch({
                    type: "set-background-color",
                    value: event.target.value,
                  })
                }
              />
              <Input
                type="text"
                value={background.color}
                className="font-mono text-xs"
                onChange={(event) =>
                  dispatch({
                    type: "set-background-color",
                    value: event.target.value,
                  })
                }
              />
            </div>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="background-image">Image</FieldLabel>
            <Input
              id="background-image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                onImageUpload(file)
              }}
            />
            {background.imageSrc ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => onImageUpload(null)}
              >
                Remove image
              </Button>
            ) : null}
          </Field>
        )}

        {background.type === "image" ? (
          <Field>
            <FieldLabel htmlFor="background-fit">Fit</FieldLabel>
            <ToggleGroup
              id="background-fit"
              type="single"
              variant="outline"
              spacing={0}
              value={background.fit}
              onValueChange={(value) => {
                if (isBackgroundFit(value)) {
                  dispatch({ type: "set-background-fit", value })
                }
              }}
            >
              <ToggleGroupItem value="cover" className="min-w-12">
                Cover
              </ToggleGroupItem>
              <ToggleGroupItem value="contain" className="min-w-12">
                Contain
              </ToggleGroupItem>
              <ToggleGroupItem value="fit" className="min-w-12">
                Fit
              </ToggleGroupItem>
              <ToggleGroupItem value="tile" className="min-w-12">
                Tile
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        ) : null}
      </FieldGroup>
    </SettingsSection>
  )
}

function isBackgroundFit(value: string): value is BackgroundFit {
  return (
    value === "cover" ||
    value === "contain" ||
    value === "fit" ||
    value === "tile"
  )
}
