import { BackgroundSettingsSection } from "@/features/designer/components/settings/background-settings-section"
import {
  CanvasSettingsSection,
  PresetsSection,
} from "@/features/designer/components/settings/canvas-settings-section"
import { ExportSummarySection } from "@/features/designer/components/settings/export-summary-section"
import { GuidesSettingsSection } from "@/features/designer/components/settings/guides-settings-section"
import { PrintSettingsSection } from "@/features/designer/components/settings/print-settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { Selection } from "@/features/designer/model/ui-types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

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
    <div className="flex flex-col gap-6">
      <CanvasSettingsSection settings={settings} dispatch={dispatch} />
      <Separator />
      <PresetsSection settings={settings} dispatch={dispatch} />
      <Separator />
      <PrintSettingsSection settings={settings} dispatch={dispatch} />
      {settings.unit === "cm" ? <Separator /> : null}
      <BackgroundSettingsSection
        settings={settings}
        dispatch={dispatch}
        onImageUpload={onImageUpload}
      />
      <Separator />
      <ExportSummarySection settings={settings} />
      <Separator />
      <GuidesSettingsSection settings={settings} dispatch={dispatch} />
      <Separator />
      <div>
        <h3 className="text-sm font-medium">Tools</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Element tools will appear here after settings are complete.
        </p>
        <Button variant="outline" className="mt-4 w-full" disabled>
          Coming soon
        </Button>
      </div>
    </div>
  )
}

export function ObjectSettingsPanel() {
  return (
    <div className="flex flex-col gap-3 py-8 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Object settings</p>
      <p>
        Select an element to edit its properties. Coming with element tools.
      </p>
    </div>
  )
}

export function getPanelTitle(selection: Selection) {
  return selection.kind === "page" ? "Page" : "Object"
}
