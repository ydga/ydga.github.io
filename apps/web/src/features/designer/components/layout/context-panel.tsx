import { X } from "lucide-react"

import {
  getPanelTitle,
  ObjectSettingsPanel,
  PageSettingsPanel,
} from "@/features/designer/components/layout/page-settings-panel"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ContextPanelProps = {
  ui: DesignerUi
  settings: CanvasSettings
  dispatch: DesignerDispatch
  onImageUpload: (file: File | null) => void
}

export function ContextPanel({
  ui,
  settings,
  dispatch,
  onImageUpload,
}: ContextPanelProps) {
  const { selection, setPanelOpen } = ui
  const title = getPanelTitle(selection)

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-background transition-[width,margin] duration-200 ease-out",
        ui.panelOpen ? "w-80" : "w-0 overflow-hidden border-l-0"
      )}
      aria-hidden={!ui.panelOpen}
    >
      <div className="flex h-full w-80 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Settings</p>
            <h2 className="font-heading text-sm font-medium">{title}</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close settings panel"
            onClick={() => setPanelOpen(false)}
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {selection.kind === "page" ? (
            <PageSettingsPanel
              settings={settings}
              dispatch={dispatch}
              onImageUpload={onImageUpload}
            />
          ) : (
            <ObjectSettingsPanel />
          )}
        </div>
      </div>
    </aside>
  )
}
