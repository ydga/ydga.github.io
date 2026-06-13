import { Columns3, Crosshair, Scan, Shield, Square } from "lucide-react"

import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type {
  CanvasSettings,
  ExportBurnInSettings,
} from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { cn } from "@workspace/ui/lib/utils"

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
    <SettingsSection title="Guides in file">
      <div className="flex flex-wrap gap-2">
        <BurnInToggle
          label="Crop marks"
          icon={Square}
          checked={burnIn.trim}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "trim", value })
          }
        />
        <BurnInToggle
          label="Bleed"
          icon={Scan}
          checked={burnIn.bleed}
          disabled={!print.bleedEnabled}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "bleed", value })
          }
        />
        <BurnInToggle
          label="Safe area"
          icon={Shield}
          checked={burnIn.safe}
          disabled={!print.safeEnabled}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "safe", value })
          }
        />
        <BurnInToggle
          label="Center lines"
          icon={Crosshair}
          checked={burnIn.center}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "center", value })
          }
        />
        <BurnInToggle
          label="Thirds"
          icon={Columns3}
          checked={burnIn.thirds}
          onCheckedChange={(value) =>
            dispatch({ type: "set-export-burn-in", key: "thirds", value })
          }
        />
      </div>
    </SettingsSection>
  )
}

function BurnInToggle({
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
