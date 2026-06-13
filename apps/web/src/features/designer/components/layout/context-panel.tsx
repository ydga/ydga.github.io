import { ArrowLeft, X } from "lucide-react"

import {
  ObjectSettingsPanel,
  PageSettingsPanel,
} from "@/features/designer/components/layout/page-settings-panel"
import { getPanelTitle } from "@/features/designer/components/layout/panel-title"
import { ExportSettingsPanel } from "@/features/designer/components/settings/export-settings-panel"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ContextPanelProps = {
  ui: DesignerUi
  settings: CanvasSettings
  dispatch: DesignerDispatch
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onImageUpload: (file: File | null) => void
}

export function ContextPanel({
  ui,
  settings,
  dispatch,
  canvasRef,
  onImageUpload,
}: ContextPanelProps) {
  const { selection, panelMode } = ui
  const isExport = panelMode === "export"

  const title = isExport
    ? "Export"
    : selection.kind === "page"
      ? ui.pageName || "Untitled"
      : getPanelTitle(selection)

  const eyebrow = isExport ? "Export" : "Settings"

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
          <div className="min-w-0">
            {isExport ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-1 h-6 px-0 text-xs text-muted-foreground hover:bg-transparent"
                onClick={() => ui.setPanelMode("document")}
              >
                <ArrowLeft data-icon="inline-start" />
                Document
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{eyebrow}</p>
            )}
            <h2 className="truncate font-heading text-xs font-medium">
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close panel"
            onClick={() => ui.closePanel()}
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {isExport ? (
            <ExportSettingsPanel
              ui={ui}
              settings={settings}
              dispatch={dispatch}
              canvasRef={canvasRef}
            />
          ) : selection.kind === "page" ? (
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
