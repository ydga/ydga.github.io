import { RotateCw } from "lucide-react"

import {
  getPresetCategoryForSettings,
  getPresetsForIntent,
  isPresetActive,
} from "@/features/designer/model/presets"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import {
  getDimensionMin,
  getDimensionStep,
  getDocumentIntent,
} from "@/features/designer/lib/document-intent"
import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import { FramePresetCard } from "@workspace/ui/components/settings/frame-preset-card"
import {
  PresetCategoryTabs,
  type PresetCategory,
} from "@workspace/ui/components/settings/preset-category-tabs"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { Button } from "@workspace/ui/components/button"

type CanvasSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function CanvasSettingsSection({
  settings,
  dispatch,
}: CanvasSettingsSectionProps) {
  const { width, height } = settings
  const intent = getDocumentIntent(settings)

  const min = getDimensionMin(intent)
  const step = getDimensionStep(intent)

  return (
    <SettingSection title="Dimensions">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <DimensionField
            width={width}
            height={height}
            unit={settings.unit}
            min={min}
            step={step}
            onWidthChange={(value) => dispatch({ type: "set-width", value })}
            onHeightChange={(value) => dispatch({ type: "set-height", value })}
          />

          <SettingControl label="Rotate">
            <Button
              type="button"
              variant="iconTile"
              size="icon-sm"
              className="size-7"
              aria-label="Rotate frame"
              disabled={width === height}
              onClick={() => dispatch({ type: "rotate-orientation" })}
            >
              <RotateCw className="size-3.5" />
            </Button>
          </SettingControl>
        </div>
      </div>
    </SettingSection>
  )
}

export function PresetsSection({
  settings,
  dispatch,
}: CanvasSettingsSectionProps) {
  const category = getPresetCategoryForSettings(settings)
  const presets = getPresetsForIntent(category)

  function handleCategoryChange(next: PresetCategory) {
    dispatch({ type: "set-intent", value: next })
  }

  return (
    <SettingSection title="Presets">
      <div className="flex flex-col gap-2">
        <PresetCategoryTabs
          value={category}
          onValueChange={handleCategoryChange}
        />
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <FramePresetCard
              key={preset.id}
              label={preset.label}
              description={preset.description}
              aspectRatio={preset.aspectRatio}
              active={isPresetActive(
                preset,
                settings.width,
                settings.height,
                settings.unit
              )}
              onSelect={() => dispatch({ type: "apply-preset", preset })}
            />
          ))}
        </div>
      </div>
    </SettingSection>
  )
}
