import { PanelRight } from "lucide-react"

import { LayersPanel } from "@/features/designer/components/layers/layers-panel"
import {
  ObjectSettingsPanel,
  PageSettingsPanel,
} from "@/features/designer/components/layout/page-settings-panel"
import {
  getFramePanelTitle,
  getPanelTitle,
} from "@/features/designer/components/layout/panel-title"
import { TextLayerSettingsPanel } from "@/features/designer/components/settings/text-layer-settings-panel"
import { ShapeLayerSettingsPanel } from "@/features/designer/components/settings/shape-layer-settings-panel"
import { ImageLayerSettingsPanel } from "@/features/designer/components/settings/image-layer-settings-panel"
import { ExportSettingsPanel } from "@/features/designer/components/settings/export-settings-panel"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import type {
  ImageLayer,
  ImageLayerUpdatePatch,
  Layer,
  ShapeLayer,
  ShapeLayerUpdatePatch,
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  resolveContextPanelMode,
  type Selection,
} from "@/features/designer/model/ui-types"
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

function SidebarPanelIcon({
  pinned,
  className,
}: {
  pinned: boolean
  className?: string
}) {
  if (!pinned) {
    return <PanelRight className={className} aria-hidden />
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 3v18"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4V5Z"
        className="fill-current"
      />
    </svg>
  )
}

type ContextPanelProps = {
  layout: "docked" | "floating"
  ui: DesignerUi
  frames: DesignerFrames
  getCanvasForFrame: (frameId: string) => HTMLCanvasElement | null
  onImageUpload: (file: File | null) => void
  layers: Layer[]
  activeFrameId: string
  onReorderLayers: (frameId: string, fromIndex: number, toIndex: number) => void
  onUpdateTextLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onUpdateImageLayer: (layerId: string, patch: ImageLayerUpdatePatch) => void
  onRemoveLayer: (layerId: string) => void
  onShapeFillImageUpload: (layerId: string, file: File | null) => void
  onImageLayerFileUpload: (layerId: string, file: File | null) => void
}

function getSelectedTextLayer(
  selection: Selection,
  layers: Layer[],
  activeFrameId: string
): TextLayer | null {
  if (selection.kind !== "element" || selection.pageId !== activeFrameId) {
    return null
  }

  const found = layers.find((l) => l.id === selection.elementId)
  return found?.kind === "text" ? found : null
}

function getSelectedShapeLayer(
  selection: Selection,
  layers: Layer[],
  activeFrameId: string
): ShapeLayer | null {
  if (selection.kind !== "element" || selection.pageId !== activeFrameId) {
    return null
  }

  const found = layers.find((l) => l.id === selection.elementId)
  return found?.kind === "shape" ? found : null
}

function getSelectedImageLayer(
  selection: Selection,
  layers: Layer[],
  activeFrameId: string
): ImageLayer | null {
  if (selection.kind !== "element" || selection.pageId !== activeFrameId) {
    return null
  }

  const found = layers.find((l) => l.id === selection.elementId)
  return found?.kind === "image" ? found : null
}

export function ContextPanel({
  layout,
  ui,
  frames,
  getCanvasForFrame,
  onImageUpload,
  layers,
  activeFrameId,
  onReorderLayers,
  onUpdateTextLayer,
  onUpdateShapeLayer,
  onUpdateImageLayer,
  onRemoveLayer,
  onShapeFillImageUpload,
  onImageLayerFileUpload,
}: ContextPanelProps) {
  const { selection, panelMode, toolbarTool, frameEngagedId } = ui
  const contextPanelMode = resolveContextPanelMode(
    toolbarTool,
    panelMode,
    selection,
    frameEngagedId
  )

  const selectedTextLayer = getSelectedTextLayer(
    selection,
    layers,
    activeFrameId
  )

  const selectedShapeLayer = getSelectedShapeLayer(
    selection,
    layers,
    activeFrameId
  )

  const selectedImageLayer = getSelectedImageLayer(
    selection,
    layers,
    activeFrameId
  )

  const { trimWidthPx, trimHeightPx } = getExportDimensions(frames.settings)

  const title =
    contextPanelMode === "export"
      ? "Export"
      : contextPanelMode === "layers"
        ? "Layers"
        : selection.kind === "page"
          ? getFramePanelTitle(frames.frameName)
          : selectedTextLayer != null
            ? "Text"
            : selectedShapeLayer != null
              ? "Shape"
              : selectedImageLayer != null
                ? "Image"
                : getPanelTitle(selection)

  const isFloating = layout === "floating"

  return (
    <aside
      className={cn(
        "flex flex-col bg-background",
        isFloating
          ? "h-full w-full overflow-hidden"
          : cn(
              "shrink-0 transition-[width,margin] duration-200 ease-out",
              ui.isPanelVisible
                ? "w-[var(--panel-width)]"
                : "w-0 overflow-hidden"
            )
      )}
      aria-hidden={!ui.isPanelVisible}
    >
      <div
        className={cn(
          "flex h-full flex-col",
          isFloating ? "w-full" : "w-[var(--panel-width)]"
        )}
      >
        <div className={panelHeaderClassName}>
          <h2 className={panelTitleClassName}>{title}</h2>
          <PanelIconTileButton
            type="button"
            aria-label={ui.panelPinned ? "Unpin sidebar" : "Pin sidebar"}
            aria-pressed={ui.panelPinned}
            onClick={() => ui.togglePanelPin()}
          >
            <SidebarPanelIcon
              pinned={ui.panelPinned}
              className={panelIconClassName}
            />
          </PanelIconTileButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {contextPanelMode === "export" ? (
            <ExportSettingsPanel
              frames={frames.frames}
              activeFrameId={frames.activeFrameId}
              getCanvasForFrame={getCanvasForFrame}
              onFrameNameChange={frames.setFrameNameForFrame}
              layers={layers}
            />
          ) : (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                panelPaddingClassName
              )}
            >
              {contextPanelMode === "layers" ? (
                <LayersPanel
                  ui={ui}
                  frameId={activeFrameId}
                  layers={layers}
                  onReorder={onReorderLayers}
                  onUpdateLayer={onUpdateTextLayer}
                  onUpdateShapeLayer={onUpdateShapeLayer}
                  onUpdateImageLayer={onUpdateImageLayer}
                  onRemoveLayer={onRemoveLayer}
                />
              ) : selection.kind === "page" ? (
                <PageSettingsPanel
                  settings={frames.settings}
                  dispatch={frames.dispatch}
                  onImageUpload={onImageUpload}
                />
              ) : selectedTextLayer ? (
                <TextLayerSettingsPanel
                  layer={selectedTextLayer}
                  trimWidthPx={trimWidthPx}
                  trimHeightPx={trimHeightPx}
                  onUpdate={(patch) =>
                    onUpdateTextLayer(selectedTextLayer.id, patch)
                  }
                />
              ) : selectedShapeLayer ? (
                <ShapeLayerSettingsPanel
                  layer={selectedShapeLayer}
                  trimWidthPx={trimWidthPx}
                  trimHeightPx={trimHeightPx}
                  onUpdate={(patch) =>
                    onUpdateShapeLayer(selectedShapeLayer.id, patch)
                  }
                  onFillImageUpload={(file) =>
                    onShapeFillImageUpload(selectedShapeLayer.id, file)
                  }
                />
              ) : selectedImageLayer ? (
                <ImageLayerSettingsPanel
                  layer={selectedImageLayer}
                  trimWidthPx={trimWidthPx}
                  trimHeightPx={trimHeightPx}
                  onUpdate={(patch) =>
                    onUpdateImageLayer(selectedImageLayer.id, patch)
                  }
                  onImageUpload={(file) =>
                    onImageLayerFileUpload(selectedImageLayer.id, file)
                  }
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
