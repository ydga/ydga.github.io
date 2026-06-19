import { Download, Frame, Layers, Type } from "lucide-react"

import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import type { PanelMode } from "@/features/designer/model/ui-types"
import { NavIconButton } from "@workspace/ui/components/settings/nav-icon-button"
import {
  SlidingNavIndicator,
  SlidingNavItem,
} from "@workspace/ui/components/settings/sliding-nav-indicator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

const TOOLBAR_ITEMS = [
  { view: "document" as const, label: "Frame", icon: Frame },
  { view: "layers" as const, label: "Layers", icon: Layers },
  { view: "export" as const, label: "Export", icon: Download },
]

type CanvasToolbarProps = {
  ui: DesignerUi
}

export function CanvasToolbar({ ui }: CanvasToolbarProps) {
  const textToolActive = ui.canvasTool === "text"
  const activeIndex = textToolActive
    ? null
    : getToolbarActiveIndex(ui.panelOpen, ui.panelMode)

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      className="flex flex-col gap-2"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <NavIconButton
            active={textToolActive}
            aria-label="Text tool"
            aria-pressed={textToolActive}
            className={cn(
              textToolActive &&
                "bg-primary hover:bg-primary/90 hover:text-primary-foreground"
            )}
            onClick={() => ui.setCanvasTool("text")}
          >
            <Type aria-hidden />
          </NavIconButton>
        </TooltipTrigger>
        <TooltipContent side="left">Text</TooltipContent>
      </Tooltip>

      <SlidingNavIndicator
        activeIndex={activeIndex}
        variant="primary"
        className="flex flex-col gap-1"
      >
        {TOOLBAR_ITEMS.map(({ view, label, icon: Icon }) => {
          const active =
            !textToolActive && ui.panelOpen && ui.panelMode === view

          return (
            <SlidingNavItem key={view}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavIconButton
                    active={active}
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => {
                      ui.setCanvasTool("select")
                      ui.togglePanelView(view)
                    }}
                  >
                    <Icon />
                  </NavIconButton>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            </SlidingNavItem>
          )
        })}
      </SlidingNavIndicator>
    </div>
  )
}

function getToolbarActiveIndex(
  panelOpen: boolean,
  panelMode: PanelMode
): number | null {
  if (!panelOpen) {
    return null
  }

  return TOOLBAR_ITEMS.findIndex((item) => item.view === panelMode)
}
