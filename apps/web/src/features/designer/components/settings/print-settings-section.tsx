import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"

type PrintSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function PrintSettingsSection({
  settings,
  dispatch,
}: PrintSettingsSectionProps) {
  if (settings.unit !== "cm") {
    return null
  }

  const unitLabel = "cm"

  return (
    <SettingsSection
      title="Print"
      description="Bleed extends past trim. Safe area keeps important content inset."
    >
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="bleed-enabled">Bleed</FieldLabel>
          <Switch
            id="bleed-enabled"
            checked={settings.print.bleedEnabled}
            onCheckedChange={(value) =>
              dispatch({ type: "set-bleed-enabled", value })
            }
          />
        </Field>

        {settings.print.bleedEnabled ? (
          <Field>
            <FieldLabel htmlFor="bleed-size">
              Bleed per edge ({unitLabel})
            </FieldLabel>
            <Input
              id="bleed-size"
              type="number"
              min={0.1}
              step={0.01}
              value={settings.print.bleed}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (!Number.isNaN(parsed)) {
                  dispatch({ type: "set-bleed", value: parsed })
                }
              }}
            />
          </Field>
        ) : null}

        <Field orientation="horizontal">
          <FieldLabel htmlFor="safe-enabled">Safe area</FieldLabel>
          <Switch
            id="safe-enabled"
            checked={settings.print.safeEnabled}
            onCheckedChange={(value) =>
              dispatch({ type: "set-safe-enabled", value })
            }
          />
        </Field>

        {settings.print.safeEnabled ? (
          <Field>
            <FieldLabel htmlFor="safe-inset">
              Safe inset from trim ({unitLabel})
            </FieldLabel>
            <Input
              id="safe-inset"
              type="number"
              min={0.1}
              step={0.01}
              value={settings.print.safeInset}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (!Number.isNaN(parsed)) {
                  dispatch({ type: "set-safe-inset", value: parsed })
                }
              }}
            />
          </Field>
        ) : null}

        <FieldDescription>
          Export includes bleed when enabled. Safe area is a guide only.
        </FieldDescription>
      </FieldGroup>
    </SettingsSection>
  )
}
