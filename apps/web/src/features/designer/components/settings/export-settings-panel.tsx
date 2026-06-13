import { ExportBurnInSection } from "@/features/designer/components/settings/export-burn-in-section"
import {
  ExportSummarySection,
  useExportOverLimit,
} from "@/features/designer/components/settings/export-summary-section"
import { PrintSettingsSection } from "@/features/designer/components/settings/print-settings-section"
import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import {
  getDocumentIntentLabel,
  isPrintDocument,
  isScreenDocument,
} from "@/features/designer/lib/document-intent"
import { downloadExport } from "@/features/designer/lib/export-canvas"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import { Button } from "@workspace/ui/components/button"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

type ExportSettingsPanelProps = {
  ui: DesignerUi
  settings: CanvasSettings
  dispatch: DesignerDispatch
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function ExportSettingsPanel({
  ui,
  settings,
  dispatch,
  canvasRef,
}: ExportSettingsPanelProps) {
  const overLimit = useExportOverLimit(settings)
  const category = getDocumentIntentLabel(settings)
  const isScreen = isScreenDocument(settings)
  const isPrint = isPrintDocument(settings)

  async function handleExport() {
    if (overLimit) {
      return
    }

    await downloadExport(settings, canvasRef.current, ui.pageName)
  }

  const exportLabel = isScreen
    ? `Export ${settings.export.screenFormat.toUpperCase()}`
    : "Export PDF"

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection title={category}>
        {isScreen ? (
          <div className="flex flex-col gap-3">
            <SettingControl label="Scale">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={String(settings.pixelScale)}
                onValueChange={(value) => {
                  if (value === "1" || value === "2") {
                    dispatch({
                      type: "set-pixel-scale",
                      value: Number(value) as 1 | 2,
                    })
                  }
                }}
              >
                <ToggleGroupItem value="1" aria-label="1× scale">
                  1×
                </ToggleGroupItem>
                <ToggleGroupItem value="2" aria-label="2× scale">
                  2×
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingControl>

            <SettingControl label="Format">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={settings.export.screenFormat}
                onValueChange={(value) => {
                  if (value === "png" || value === "jpg") {
                    dispatch({ type: "set-screen-export-format", value })
                  }
                }}
              >
                <ToggleGroupItem value="png" aria-label="PNG">
                  PNG
                </ToggleGroupItem>
                <ToggleGroupItem value="jpg" aria-label="JPG">
                  JPG
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingControl>
          </div>
        ) : null}

        {isPrint ? (
          <div className="flex flex-col gap-3">
            <SettingControl label="Resolution">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={String(settings.dpi)}
                onValueChange={(value) => {
                  const nextDpi = Number(value)
                  if ([300, 260, 220, 172].includes(nextDpi)) {
                    dispatch({
                      type: "set-dpi",
                      value: nextDpi as CanvasSettings["dpi"],
                    })
                  }
                }}
              >
                {[300, 260, 220, 172].map((option) => (
                  <ToggleGroupItem
                    key={option}
                    value={String(option)}
                    aria-label={`${option} resolution`}
                    className="min-w-9 px-2"
                  >
                    {option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingControl>

            <SettingControl label="Format">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value="pdf"
              >
                <ToggleGroupItem
                  value="pdf"
                  aria-label="PDF"
                  className="min-w-16"
                >
                  PDF
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingControl>
          </div>
        ) : null}
      </SettingsSection>

      {isPrint ? (
        <>
          <PrintSettingsSection settings={settings} dispatch={dispatch} />
          <ExportBurnInSection settings={settings} dispatch={dispatch} />
        </>
      ) : null}

      <ExportSummarySection settings={settings} />

      <Button
        type="button"
        className="h-8 w-full text-xs"
        disabled={overLimit}
        onClick={() => void handleExport()}
      >
        {exportLabel}
      </Button>
    </div>
  )
}
