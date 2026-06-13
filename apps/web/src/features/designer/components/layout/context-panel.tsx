import { PanelLeft } from "lucide-react"

import { LayersPanel } from "@/features/designer/components/layers/layers-panel"
import {
  ObjectSettingsPanel,
  PageSettingsPanel,
} from "@/features/designer/components/layout/page-settings-panel"
import {
  getFramePanelTitle,
  getPanelTitle,
} from "@/features/designer/components/layout/panel-title"
import { ExportSettingsPanel } from "@/features/designer/components/settings/export-settings-panel"
import type { Layer } from "@/features/designer/model/layers"
import type { DesignerFrames } from "@/features/designer/state/use-designer-frames"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import { PanelIconTileButton } from "@workspace/ui/components/settings/panel-icon-tile-button"
import {
  panelHeaderClassName,
  panelIconClassName,
  panelPaddingClassName,
  panelTitleClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import { cn } from "@workspace/ui/lib/utils"

type ContextPanelProps = {
  ui: DesignerUi
  frames: DesignerFrames
  getCanvasForFrame: (frameId: string) => HTMLCanvasElement | null
  onImageUpload: (file: File | null) => void
  layers: Layer[]
  activeFrameId: string
  onReorderLayers: (frameId: string, fromIndex: number, toIndex: number) => void
}

export function ContextPanel({
  ui,
  frames,
  getCanvasForFrame,
  onImageUpload,
  layers,
  activeFrameId,
  onReorderLayers,
}: ContextPanelProps) {
  const { selection, panelMode } = ui

  const title =
    panelMode === "export"
      ? "Export"
      : panelMode === "layers"
        ? "Layers"
        : selection.kind === "page"
          ? getFramePanelTitle(frames.frameName)
          : getPanelTitle(selection)

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-background transition-[width,margin] duration-200 ease-out",
        ui.panelOpen
          ? "w-[var(--panel-width)]"
          : "w-0 overflow-hidden border-l-0"
      )}
      aria-hidden={!ui.panelOpen}
    >
      <div className="flex h-full w-[var(--panel-width)] flex-col">
        <div className={panelHeaderClassName}>
          <h2 className={panelTitleClassName}>{title}</h2>
          <PanelIconTileButton
            type="button"
            aria-label="Close sidebar"
            onClick={() => ui.closePanel()}
          >
            <PanelLeft className={panelIconClassName} />
          </PanelIconTileButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {panelMode === "export" ? (
            <ExportSettingsPanel
              frames={frames.frames}
              activeFrameId={frames.activeFrameId}
              getCanvasForFrame={getCanvasForFrame}
              onFrameNameChange={frames.setFrameNameForFrame}
            />
          ) : (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                panelPaddingClassName
              )}
            >
              {panelMode === "layers" ? (
                <LayersPanel
                  ui={ui}
                  frameId={activeFrameId}
                  layers={layers}
                  onReorder={onReorderLayers}
                />
              ) : selection.kind === "page" ? (
                <PageSettingsPanel
                  settings={frames.settings}
                  dispatch={frames.dispatch}
                  onImageUpload={onImageUpload}
                />
              ) : (
                <ObjectSettingsPanel />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
