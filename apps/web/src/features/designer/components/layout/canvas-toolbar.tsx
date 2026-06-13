import { Download, Frame, Layers } from "lucide-react"

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

const TOOLBAR_ITEMS = [
  { view: "document" as const, label: "Frame", icon: Frame },
  { view: "layers" as const, label: "Layers", icon: Layers },
  { view: "export" as const, label: "Export", icon: Download },
]

type CanvasToolbarProps = {
  ui: DesignerUi
}

export function CanvasToolbar({ ui }: CanvasToolbarProps) {
  const activeIndex = getToolbarActiveIndex(ui.panelOpen, ui.panelMode)

  return (
    <div role="toolbar" aria-label="Canvas tools">
      <SlidingNavIndicator
        activeIndex={activeIndex}
        variant="primary"
        className="flex flex-col gap-1"
      >
        {TOOLBAR_ITEMS.map(({ view, label, icon: Icon }) => {
          const active = ui.panelOpen && ui.panelMode === view

          return (
            <SlidingNavItem key={view}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavIconButton
                    active={active}
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => ui.togglePanelView(view)}
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
