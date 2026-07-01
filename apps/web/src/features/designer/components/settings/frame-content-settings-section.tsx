import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import { Checkbox } from "@workspace/ui/components/checkbox"

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
      <label
        htmlFor="frame-clip-content"
        className="flex cursor-pointer items-center gap-2"
      >
        <Checkbox
          id="frame-clip-content"
          checked={settings.clipContent === true}
          onCheckedChange={(checked) => {
            if (typeof checked !== "boolean") {
              return
            }
            dispatch({ type: "set-clip-content", value: checked })
          }}
        />
        <span className="text-xs leading-none text-foreground">
          Clip content
        </span>
      </label>
    </SettingSection>
  )
}
