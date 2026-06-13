import { ExportPageList } from "@/features/designer/components/settings/export-page-list"
import { isExportOverLimit } from "@/features/designer/lib/dimensions"
import { getExportCtaLabel } from "@/features/designer/lib/export-cta-label"
import { downloadExports } from "@/features/designer/lib/export-canvas"
import { mergeExportOverrides } from "@/features/designer/lib/export-settings"
import type { DesignerFrame } from "@/features/designer/model/frames"
import { useExportSelection } from "@/features/designer/state/use-export-selection"
import { Button } from "@workspace/ui/components/button"
import {
  panelBodyClassName,
  panelCtaClassName,
  panelScrollContentClassName,
  panelStickyFooterClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import { cn } from "@workspace/ui/lib/utils"

type ExportSettingsPanelProps = {
  frames: DesignerFrame[]
  activeFrameId: string
  getCanvasForFrame: (frameId: string) => HTMLCanvasElement | null
  onFrameNameChange: (frameId: string, name: string) => void
}

export function ExportSettingsPanel({
  frames,
  activeFrameId,
  getCanvasForFrame,
  onFrameNameChange,
}: ExportSettingsPanelProps) {
  const {
    orderedEntries,
    selectedEntries,
    syncSettings,
    setSyncSettingsEnabled,
    selectAll,
    clearSelection,
    setSelected,
    setPixelScale,
    setScreenFormat,
    setDpi,
  } = useExportSelection(frames, activeFrameId)

  const frameById = new Map(frames.map((frame) => [frame.id, frame]))

  const exportTargets = selectedEntries.map((entry) => {
    const frame = frameById.get(entry.frameId)!
    const settings = mergeExportOverrides(frame.settings, entry.overrides)

    return {
      frameId: entry.frameId,
      pageName: frame.name,
      settings,
      overrides: entry.overrides,
    }
  })

  const hasOverLimit = exportTargets.some((target) =>
    isExportOverLimit(target.settings)
  )

  const ctaLabel = getExportCtaLabel(exportTargets)
  const canExport = exportTargets.length > 0 && !hasOverLimit

  async function handleExport() {
    if (!canExport) {
      return
    }

    await downloadExports(
      exportTargets.map((target) => ({
        pageName: target.pageName,
        settings: frameById.get(target.frameId)!.settings,
        overrides: target.overrides,
        sourceCanvas: getCanvasForFrame(target.frameId),
      }))
    )
  }

  return (
    <div className={panelBodyClassName}>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          panelScrollContentClassName
        )}
      >
        <ExportPageList
          frames={frames}
          entries={orderedEntries}
          syncSettings={syncSettings}
          onSyncSettingsChange={setSyncSettingsEnabled}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onSelectChange={setSelected}
          onFrameNameChange={onFrameNameChange}
          onPixelScaleChange={setPixelScale}
          onScreenFormatChange={setScreenFormat}
          onDpiChange={setDpi}
        />
      </div>

      <div className={panelStickyFooterClassName}>
        <Button
          type="button"
          size="lg"
          className={panelCtaClassName}
          disabled={!canExport}
          onClick={() => void handleExport()}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}
