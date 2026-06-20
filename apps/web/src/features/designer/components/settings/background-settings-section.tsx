import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { FillBackgroundField } from "@/features/designer/components/settings/fill-background-field"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"

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
      <FillBackgroundField
        background={background}
        swatchAriaLabel="Edit background"
        transparentHelpText="No background fill on export."
        onAction={(action) => dispatch(action)}
        onImageUpload={onImageUpload}
      />
    </SettingSection>
  )
}
