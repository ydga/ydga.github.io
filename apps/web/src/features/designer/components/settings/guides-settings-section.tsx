import { Columns3, Crosshair, Scan, Shield, Square } from "lucide-react"

import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { cn } from "@workspace/ui/lib/utils"

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
    <SettingsSection title="Preview guides">
      <div className="flex flex-wrap gap-2">
        {showPrintGuides ? (
          <>
            <GuideToggle
              label="Crop marks"
              icon={Square}
              checked={guides.showTrim}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showTrim", value })
              }
            />
            <GuideToggle
              label="Bleed guide"
              icon={Scan}
              checked={guides.showBleed && print.bleedEnabled}
              disabled={!print.bleedEnabled}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showBleed", value })
              }
            />
            <GuideToggle
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

        <GuideToggle
          label="Center lines"
          icon={Crosshair}
          checked={guides.showCenter}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showCenter", value })
          }
        />
        <GuideToggle
          label="Rule of thirds"
          icon={Columns3}
          checked={guides.showThirds}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showThirds", value })
          }
        />
      </div>
    </SettingsSection>
  )
}

function GuideToggle({
  label,
  icon: Icon,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
  disabled?: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <SettingControl label={label}>
      <button
        type="button"
        aria-pressed={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-4xl border border-input transition-colors hover:bg-muted",
          checked && "border-ring bg-muted ring-1 ring-ring",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Icon className="size-3.5" />
      </button>
    </SettingControl>
  )
}
