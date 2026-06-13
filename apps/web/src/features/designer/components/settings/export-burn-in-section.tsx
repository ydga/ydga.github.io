import { Columns3, Crosshair, Scan, Shield, Square } from "lucide-react"

import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { LabeledIconToggle } from "@workspace/ui/components/settings/labeled-icon-toggle"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"

type ExportBurnInSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function ExportBurnInSection({
  settings,
  dispatch,
}: ExportBurnInSectionProps) {
  if (!isPrintDocument(settings)) {
    return null
  }

  const { burnIn } = settings.export
  const { print } = settings

  return (
    <SettingSection title="Guides in file">
      <div className="flex flex-wrap gap-2">
        <LabeledIconToggle
          label="Crop marks"
          icon={Square}
          checked={burnIn.trim}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "trim", value })
          }
        />
        <LabeledIconToggle
          label="Bleed"
          icon={Scan}
          checked={burnIn.bleed}
          disabled={!print.bleedEnabled}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "bleed", value })
          }
        />
        <LabeledIconToggle
          label="Safe area"
          icon={Shield}
          checked={burnIn.safe}
          disabled={!print.safeEnabled}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "safe", value })
          }
        />
        <LabeledIconToggle
          label="Center lines"
          icon={Crosshair}
          checked={burnIn.center}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "center", value })
          }
        />
        <LabeledIconToggle
          label="Thirds"
          icon={Columns3}
          checked={burnIn.thirds}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "thirds", value })
          }
        />
      </div>
    </SettingSection>
  )
}
