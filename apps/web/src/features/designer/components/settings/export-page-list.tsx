import {
  isPrintDocument,
  isScreenDocument,
} from "@/features/designer/lib/document-intent"
import {
  isExportOverLimit,
  isPrintDpi,
  PRINT_DPI_OPTIONS,
} from "@/features/designer/lib/dimensions"
import { mergeExportOverrides } from "@/features/designer/lib/export-settings"
import type { DesignerFrame } from "@/features/designer/model/frames"
import type { PageExportEntry } from "@/features/designer/state/use-export-selection"
import { ExportPageActions } from "@/features/designer/components/settings/export-page-actions"
import { FrameNameField } from "@/features/designer/components/layout/page-controls"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import { cn } from "@workspace/ui/lib/utils"

type ExportPageListProps = {
  frames: DesignerFrame[]
  entries: PageExportEntry[]
  syncSettings: boolean
  onSyncSettingsChange: (enabled: boolean) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onSelectChange: (frameId: string, selected: boolean) => void
  onFrameNameChange: (frameId: string, name: string) => void
  onPixelScaleChange: (frameId: string, value: 1 | 2) => void
  onScreenFormatChange: (frameId: string, value: "png" | "jpg") => void
  onDpiChange: (
    frameId: string,
    value: PageExportEntry["overrides"]["dpi"]
  ) => void
}

export function ExportPageList({
  frames,
  entries,
  syncSettings,
  onSyncSettingsChange,
  onSelectAll,
  onClearSelection,
  onSelectChange,
  onFrameNameChange,
  onPixelScaleChange,
  onScreenFormatChange,
  onDpiChange,
}: ExportPageListProps) {
  const frameById = new Map(frames.map((frame) => [frame.id, frame]))
  const selectedCount = entries.filter((entry) => entry.selected).length
  const canSelectAll = selectedCount < entries.length
  const canClearSelection = selectedCount > 0
  const showSyncSettings = frames.length > 1

  return (
    <div className="flex flex-col gap-4">
      <ExportPageActions
        syncSettings={syncSettings}
        onSyncSettingsChange={onSyncSettingsChange}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        canSelectAll={canSelectAll}
        canClearSelection={canClearSelection}
        showSyncSettings={showSyncSettings}
      />

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => {
          const frame = frameById.get(entry.frameId)
          if (!frame) {
            return null
          }

          const settings = mergeExportOverrides(frame.settings, entry.overrides)
          const isScreen = isScreenDocument(settings)
          const isPrint = isPrintDocument(settings)
          const overLimit = isExportOverLimit(settings)

          return (
            <li
              key={entry.frameId}
              className={cn(
                "rounded-xl border border-border bg-muted/20 p-2.5",
                entry.selected && "bg-muted/35"
              )}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-2">
                <Checkbox
                  id={`export-page-${entry.frameId}`}
                  checked={entry.selected}
                  onCheckedChange={(checked) =>
                    onSelectChange(entry.frameId, checked === true)
                  }
                  aria-label={`Include ${frame.name}`}
                />
                <FrameNameField
                  pageName={frame.name}
                  showIcon={false}
                  onPageNameChange={(name) =>
                    onFrameNameChange(entry.frameId, name)
                  }
                />

                {entry.selected ? (
                  <div className="col-start-2 flex w-full gap-1.5">
                    {isScreen ? (
                      <>
                        <SettingsSelect
                          wrapperClassName="min-w-0 w-full flex-1 basis-0"
                          aria-label="Scale"
                          value={String(entry.overrides.pixelScale)}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            if (value === 1 || value === 2) {
                              onPixelScaleChange(entry.frameId, value)
                            }
                          }}
                        >
                          <option value="1">1×</option>
                          <option value="2">2×</option>
                        </SettingsSelect>
                        <SettingsSelect
                          wrapperClassName="min-w-0 w-full flex-1 basis-0"
                          aria-label="Format"
                          value={entry.overrides.screenFormat}
                          onChange={(event) => {
                            const value = event.target.value
                            if (value === "png" || value === "jpg") {
                              onScreenFormatChange(entry.frameId, value)
                            }
                          }}
                        >
                          <option value="png">png</option>
                          <option value="jpg">jpg</option>
                        </SettingsSelect>
                      </>
                    ) : null}

                    {isPrint ? (
                      <>
                        <SettingsSelect
                          label="Res"
                          labelTooltip="Resolution (DPI)"
                          wrapperClassName="min-w-0 w-full flex-1 basis-0"
                          className="text-left"
                          value={String(entry.overrides.dpi)}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            if (isPrintDpi(value)) {
                              onDpiChange(entry.frameId, value)
                            }
                          }}
                        >
                          {PRINT_DPI_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </SettingsSelect>
                        <SettingsSelect
                          wrapperClassName="min-w-0 w-full flex-1 basis-0"
                          aria-label="Format"
                          value="pdf"
                          disabled
                        >
                          <option value="pdf">pdf</option>
                        </SettingsSelect>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {entry.selected && overLimit ? (
                  <p className="col-start-2 text-[10px] text-destructive">
                    {isScreen
                      ? "Lower scale or dimensions."
                      : "Lower resolution, bleed, or dimensions."}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
