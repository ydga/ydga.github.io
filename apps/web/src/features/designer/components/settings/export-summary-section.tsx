import { SettingsSection } from "@/features/designer/components/settings/settings-section"
import type { CanvasSettings } from "@/features/designer/model/types"
import {
  getDocumentIntentLabel,
  isPrintDocument,
  isScreenDocument,
} from "@/features/designer/lib/document-intent"
import {
  getExportDimensions,
  isExportOverLimit,
} from "@/features/designer/lib/dimensions"

type ExportSummarySectionProps = {
  settings: CanvasSettings
}

export function ExportSummarySection({ settings }: ExportSummarySectionProps) {
  const exportDimensions = getExportDimensions(settings)
  const overLimit = isExportOverLimit(settings, exportDimensions)
  const category = getDocumentIntentLabel(settings)

  return (
    <SettingsSection title="Output">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/30 p-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{category}</span>
          <span className="font-mono tabular-nums">
            {exportDimensions.exportWidthPx} × {exportDimensions.exportHeightPx}
          </span>
        </div>

        {isScreenDocument(settings) ? (
          <SummaryLine
            muted
            value={`${settings.width} × ${settings.height} at ${settings.pixelScale}×`}
          />
        ) : null}

        {isPrintDocument(settings) ? (
          <>
            <SummaryLine
              muted
              value={`${settings.width} × ${settings.height} · ${settings.dpi} resolution`}
            />
            {settings.print.bleedEnabled ? (
              <SummaryLine
                muted
                value={`Includes ${settings.print.bleed} bleed`}
              />
            ) : null}
          </>
        ) : null}

        {overLimit ? (
          <p className="text-[10px] text-destructive">
            {isScreenDocument(settings)
              ? "Output exceeds the size limit. Lower scale or dimensions."
              : "Output exceeds the size limit. Lower resolution, bleed, or dimensions."}
          </p>
        ) : null}
      </div>
    </SettingsSection>
  )
}

function SummaryLine({ value, muted }: { value: string; muted?: boolean }) {
  return (
    <div className="flex justify-end">
      <span
        className={
          muted
            ? "font-mono text-[10px] text-muted-foreground tabular-nums"
            : "font-mono text-xs tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  )
}

export function useExportOverLimit(settings: CanvasSettings) {
  return isExportOverLimit(settings, getExportDimensions(settings))
}
