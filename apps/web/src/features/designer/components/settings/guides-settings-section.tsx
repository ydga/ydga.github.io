import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Switch } from "@workspace/ui/components/switch"

type GuidesSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function GuidesSettingsSection({
  settings,
  dispatch,
}: GuidesSettingsSectionProps) {
  const { guides, print, unit } = settings
  const showPrintGuides = unit === "cm"

  return (
    <SettingsSection
      title="Guides"
      description="Preview overlays only — not included in download."
    >
      <FieldGroup>
        {showPrintGuides ? (
          <>
            <GuideToggle
              id="guide-trim"
              label="Trim"
              checked={guides.showTrim}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showTrim", value })
              }
            />
            <GuideToggle
              id="guide-bleed"
              label="Bleed"
              checked={guides.showBleed && print.bleedEnabled}
              disabled={!print.bleedEnabled}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showBleed", value })
              }
            />
            <GuideToggle
              id="guide-safe"
              label="Safe area"
              checked={guides.showSafe && print.safeEnabled}
              disabled={!print.safeEnabled}
              onCheckedChange={(value) =>
                dispatch({ type: "set-guide", key: "showSafe", value })
              }
            />
          </>
        ) : null}

        <GuideToggle
          id="guide-center"
          label="Center lines"
          checked={guides.showCenter}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showCenter", value })
          }
        />
        <GuideToggle
          id="guide-thirds"
          label="Thirds"
          checked={guides.showThirds}
          onCheckedChange={(value) =>
            dispatch({ type: "set-guide", key: "showThirds", value })
          }
        />

        <FieldDescription>
          Snap alignment will apply when element tools are added.
        </FieldDescription>
      </FieldGroup>
    </SettingsSection>
  )
}

function GuideToggle({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </Field>
  )
}
