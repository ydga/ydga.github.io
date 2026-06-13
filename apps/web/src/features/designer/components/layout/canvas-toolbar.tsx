import type { ReactNode } from "react"
import { Download, FileCog } from "lucide-react"

import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type CanvasToolbarProps = {
  ui: DesignerUi
}

export function CanvasToolbar({ ui }: CanvasToolbarProps) {
  const documentActive =
    ui.panelOpen && ui.panelMode === "document" && ui.selection.kind === "page"
  const exportActive = ui.panelOpen && ui.panelMode === "export"

  function handleDocumentSettings() {
    if (documentActive) {
      ui.closePanel()
      return
    }

    ui.openDocumentPanel()
  }

  function handleExport() {
    if (exportActive) {
      ui.closePanel()
      return
    }

    ui.openExportPanel()
  }

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-20">
      <div
        className="pointer-events-auto flex flex-col gap-1 rounded-2xl border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md"
        role="toolbar"
        aria-label="Canvas tools"
      >
        <ToolbarIconButton
          label="Document settings"
          active={documentActive}
          onClick={handleDocumentSettings}
        >
          <FileCog />
        </ToolbarIconButton>

        <ToolbarIconButton
          label="Export"
          active={exportActive}
          onClick={handleExport}
        >
          <Download />
        </ToolbarIconButton>
      </div>
    </div>
  )
}

function ToolbarIconButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon-sm"
          className={cn("size-9", active && "bg-muted")}
          disabled={disabled}
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}
