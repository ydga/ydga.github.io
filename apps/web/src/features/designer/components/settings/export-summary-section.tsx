import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type {
  CanvasSettings,
  ExportDimensions,
} from "@/features/designer/model/types"
import {
  getExportDimensions,
  isExportOverLimit,
  pixelsToCm,
} from "@/features/designer/lib/dimensions"
import { FieldDescription } from "@workspace/ui/components/field"

type ExportSummarySectionProps = {
  settings: CanvasSettings
}

export function ExportSummarySection({ settings }: ExportSummarySectionProps) {
  const exportDimensions = getExportDimensions(settings)

  return (
    <SettingsSection
      title="Export"
      description="Output dimensions for preview and download."
    >
      <ExportSummary settings={settings} exportDimensions={exportDimensions} />
    </SettingsSection>
  )
}

export function ExportSummary({
  settings,
  exportDimensions,
}: {
  settings: CanvasSettings
  exportDimensions: ExportDimensions
}) {
  const overLimit = isExportOverLimit(settings, exportDimensions)
  const hasBleed = settings.print.bleedEnabled && exportDimensions.bleedPx > 0

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-sm">
      <SummaryRow
        label="Trim"
        value={`${settings.width} × ${settings.height} ${settings.unit}`}
      />
      <SummaryRow
        label="Trim (px)"
        value={`${exportDimensions.trimWidthPx} × ${exportDimensions.trimHeightPx} px`}
      />
      {hasBleed ? (
        <SummaryRow
          label="Bleed"
          value={`${settings.print.bleed} ${settings.unit} per edge`}
        />
      ) : null}
      <SummaryRow
        label="Output"
        value={`${exportDimensions.exportWidthPx} × ${exportDimensions.exportHeightPx} px`}
      />
      {settings.unit === "cm" ? (
        <SummaryRow label="DPI" value={String(settings.dpi)} />
      ) : null}
      {settings.unit === "px" && settings.pixelScale > 1 ? (
        <SummaryRow label="Scale" value={`${settings.pixelScale}×`} />
      ) : null}
      <FieldDescription>
        ≈ {pixelsToCm(exportDimensions.exportWidthPx, settings.dpi)} ×{" "}
        {pixelsToCm(exportDimensions.exportHeightPx, settings.dpi)} cm at{" "}
        {settings.dpi} DPI
      </FieldDescription>
      {overLimit ? (
        <p className="text-sm text-destructive">
          Export exceeds the 8192 px limit. Reduce size, scale, or bleed.
        </p>
      ) : null}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs">{value}</span>
    </div>
  )
}

export function useExportDimensions(settings: CanvasSettings) {
  return getExportDimensions(settings)
}
