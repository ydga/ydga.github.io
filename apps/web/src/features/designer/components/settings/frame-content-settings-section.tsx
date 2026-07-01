import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import { Switch } from "@workspace/ui/components/switch"

type FrameContentSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function FrameContentSettingsSection({
  settings,
  dispatch,
}: FrameContentSettingsSectionProps) {
  return (
    <SettingSection title="Content">
      <SettingControl label="Clip to frame">
        <Switch
          checked={settings.clipContent === true}
          aria-label="Clip content to frame"
          onCheckedChange={(value) =>
            dispatch({ type: "set-clip-content", value })
          }
        />
      </SettingControl>
    </SettingSection>
  )
}
