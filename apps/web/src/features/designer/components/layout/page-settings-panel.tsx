import { BackgroundSettingsSection } from "@/features/designer/components/settings/background-settings-section"
import {
  CanvasSettingsSection,
  PresetsSection,
} from "@/features/designer/components/settings/canvas-settings-section"
import { FrameContentSettingsSection } from "@/features/designer/components/settings/frame-content-settings-section"
import { GuidesSettingsSection } from "@/features/designer/components/settings/guides-settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { panelSectionClassName } from "@workspace/ui/components/settings/settings-field-styles"

type PageSettingsPanelProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
  onImageUpload: (file: File | null) => void
}

export function PageSettingsPanel({
  settings,
  dispatch,
  onImageUpload,
}: PageSettingsPanelProps) {
  return (
    <div className={panelSectionClassName}>
      <CanvasSettingsSection settings={settings} dispatch={dispatch} />
      <FrameContentSettingsSection settings={settings} dispatch={dispatch} />
      <BackgroundSettingsSection
        settings={settings}
        dispatch={dispatch}
        onImageUpload={onImageUpload}
      />
      <PresetsSection settings={settings} dispatch={dispatch} />
      <GuidesSettingsSection settings={settings} dispatch={dispatch} />
    </div>
  )
}

export function ObjectSettingsPanel() {
  return (
    <div className="flex flex-col gap-3 py-8 text-center text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Object settings</p>
      <p>
        Select an element to edit its properties. Coming with element tools.
      </p>
    </div>
  )
}
