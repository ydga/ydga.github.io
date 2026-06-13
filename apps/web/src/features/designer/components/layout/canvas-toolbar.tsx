import type { ReactNode } from "react"
import { Download, FileCog } from "lucide-react"

import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import {
  getExportDimensions,
  isExportOverLimit,
} from "@/features/designer/lib/dimensions"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type CanvasToolbarProps = {
  ui: DesignerUi
  settings: CanvasSettings
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function CanvasToolbar({ ui, settings, canvasRef }: CanvasToolbarProps) {
  const exportDimensions = getExportDimensions(settings)
  const overLimit = isExportOverLimit(settings, exportDimensions)
  const settingsActive = ui.panelOpen && ui.selection.kind === "page"

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || overLimit) {
      return
    }

    const link = document.createElement("a")
    link.download = `image-${exportDimensions.exportWidthPx}x${exportDimensions.exportHeightPx}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  function handleDocumentSettings() {
    if (settingsActive) {
      ui.setPanelOpen(false)
      return
    }

    ui.selectPageAndOpen()
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
          active={settingsActive}
          onClick={handleDocumentSettings}
        >
          <FileCog />
        </ToolbarIconButton>

        <ToolbarIconButton
          label="Download PNG"
          disabled={overLimit}
          onClick={handleDownload}
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
