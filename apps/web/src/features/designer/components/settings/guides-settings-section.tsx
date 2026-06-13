import { Columns3, Crosshair, Scan, Shield } from "lucide-react"

import { isPrintDocument } from "@/features/designer/lib/document-intent"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { LabeledIconToggle } from "@workspace/ui/components/settings/labeled-icon-toggle"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"

type GuidesSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function GuidesSettingsSection({
  settings,
  dispatch,
}: GuidesSettingsSectionProps) {
  const { guides, print } = settings
  const showPrintGuides = isPrintDocument(settings)

  return (
    <SettingSection title="Preview guides">
      <div className="flex flex-wrap gap-2">
        {showPrintGuides ? (
          <>
            <LabeledIconToggle
              label="Bleed guide"
              icon={Scan}
              checked={guides.showBleed}
              disabled={!print.bleedEnabled}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showBleed", value })
              }
            />
            <LabeledIconToggle
              label="Safe area guide"
              icon={Shield}
              checked={guides.showSafe && print.safeEnabled}
              disabled={!print.safeEnabled}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showSafe", value })
              }
            />
          </>
        ) : null}

        <LabeledIconToggle
          label="Center lines"
          icon={Crosshair}
          checked={guides.showCenter}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showCenter", value })
          }
        />
        <LabeledIconToggle
          label="Rule of thirds"
          icon={Columns3}
          checked={guides.showThirds}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showThirds", value })
          }
        />
      </div>
    </SettingSection>
  )
}
