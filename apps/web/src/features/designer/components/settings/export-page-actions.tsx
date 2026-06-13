import { CheckCheck, ListX, Lock, LockOpen } from "lucide-react"

import { PanelIconTileButton } from "@workspace/ui/components/settings/panel-icon-tile-button"
import { PanelIconTileToggle } from "@workspace/ui/components/settings/panel-icon-tile-toggle"
import { panelIconClassName } from "@workspace/ui/components/settings/settings-field-styles"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type ExportPageActionsProps = {
  syncSettings: boolean
  onSyncSettingsChange: (enabled: boolean) => void
  onSelectAll: () => void
  onClearSelection: () => void
  canSelectAll: boolean
  canClearSelection: boolean
  showSyncSettings: boolean
}

export function ExportPageActions({
  syncSettings,
  onSyncSettingsChange,
  onSelectAll,
  onClearSelection,
  canSelectAll,
  canClearSelection,
  showSyncSettings,
}: ExportPageActionsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <PanelIconTileButton
              type="button"
              aria-label="Select all pages"
              disabled={!canSelectAll}
              onClick={onSelectAll}
            >
              <CheckCheck className={panelIconClassName} />
            </PanelIconTileButton>
          </TooltipTrigger>
          <TooltipContent side="top">Select all</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <PanelIconTileButton
              type="button"
              aria-label="Clear selection"
              disabled={!canClearSelection}
              onClick={onClearSelection}
            >
              <ListX className={panelIconClassName} />
            </PanelIconTileButton>
          </TooltipTrigger>
          <TooltipContent side="top">Clear selection</TooltipContent>
        </Tooltip>
      </div>

      {showSyncSettings ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PanelIconTileToggle
              pressed={syncSettings}
              aria-label="Lock settings for pages of the same type"
              onPressedChange={onSyncSettingsChange}
            >
              {syncSettings ? (
                <Lock className={panelIconClassName} />
              ) : (
                <LockOpen className={panelIconClassName} />
              )}
            </PanelIconTileToggle>
          </TooltipTrigger>
          <TooltipContent side="top">
            Lock settings for pages of the same type
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
