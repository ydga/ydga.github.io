import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { Input } from "@workspace/ui/components/input"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { Switch } from "@workspace/ui/components/switch"

type PrintSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
}

export function PrintSettingsSection({
  settings,
  dispatch,
}: PrintSettingsSectionProps) {
  if (!isPrintDocument(settings)) {
    return null
  }

  return (
    <SettingsSection title="Bleed & safe">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <SettingControl label="Bleed">
            <Switch
              checked={settings.print.bleedEnabled}
              aria-label="Bleed"
              onCheckedChange={(value) =>
                dispatch({ type: "set-bleed-enabled", value })
              }
            />
          </SettingControl>

          {settings.print.bleedEnabled ? (
            <SettingControl label="Bleed per edge">
              <Input
                type="number"
                min={0.1}
                step={0.01}
                value={settings.print.bleed}
                aria-label="Bleed per edge"
                placeholder="0.3"
                className="h-7 w-20 font-mono tabular-nums"
                onChange={(event) => {
                  const parsed = Number.parseFloat(event.target.value)
                  if (!Number.isNaN(parsed)) {
                    dispatch({ type: "set-bleed", value: parsed })
                  }
                }}
              />
            </SettingControl>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SettingControl label="Safe area">
            <Switch
              checked={settings.print.safeEnabled}
              aria-label="Safe area"
              onCheckedChange={(value) =>
                dispatch({ type: "set-safe-enabled", value })
              }
            />
          </SettingControl>

          {settings.print.safeEnabled ? (
            <SettingControl label="Safe inset from trim">
              <Input
                type="number"
                min={0.1}
                step={0.01}
                value={settings.print.safeInset}
                aria-label="Safe inset from trim"
                placeholder="0.3"
                className="h-7 w-20 font-mono tabular-nums"
                onChange={(event) => {
                  const parsed = Number.parseFloat(event.target.value)
                  if (!Number.isNaN(parsed)) {
                    dispatch({ type: "set-safe-inset", value: parsed })
                  }
                }}
              />
            </SettingControl>
          ) : null}
        </div>
      </div>
    </SettingsSection>
  )
}
