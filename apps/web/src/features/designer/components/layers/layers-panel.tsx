import { Layers } from "lucide-react"

import { LayerList } from "@/features/designer/components/layers/layer-list"
import {
  getLayersForFrame,
  type ImageLayerUpdatePatch,
  type Layer,
  type ShapeLayerUpdatePatch,
  type TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { resolveLayerVisible } from "@/features/designer/model/shape-layer-style"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"

type LayersPanelProps = {
  ui: DesignerUi
  frameId: string
  layers: Layer[]
  onReorder: (frameId: string, fromIndex: number, toIndex: number) => void
  onUpdateLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onUpdateImageLayer: (layerId: string, patch: ImageLayerUpdatePatch) => void
  onRemoveLayer: (layerId: string) => void
}

export function LayersPanel({
  ui,
  frameId,
  layers,
  onReorder,
  onUpdateLayer,
  onUpdateShapeLayer,
  onUpdateImageLayer,
  onRemoveLayer,
}: LayersPanelProps) {
  const frameLayers = getLayersForFrame(layers, frameId)
  const selectedLayerId =
    ui.selection.kind === "element" ? ui.selection.elementId : null

  if (frameLayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Layers className="size-4" aria-hidden />
        </div>
        <p className="text-xs font-medium text-foreground">No layers yet</p>
        <p className="max-w-[220px] text-[11px] leading-relaxed text-muted-foreground">
          Elements you add to the canvas will appear here. Drag layers to change
          stacking order.
        </p>
      </div>
    )
  }

  return (
    <LayerList
      layers={frameLayers}
      onReorder={(fromIndex, toIndex) => onReorder(frameId, fromIndex, toIndex)}
      selectedLayerId={selectedLayerId}
      onSelectLayer={(layerId) => {
        const willDeselect =
          ui.selection.kind === "element" &&
          ui.selection.pageId === frameId &&
          ui.selection.elementId === layerId

        ui.toggleElementSelection(frameId, layerId)

        if (willDeselect) {
          const active = document.activeElement
          if (active instanceof HTMLElement) {
            active.blur()
          }
        }
      }}
      onToggleVisibility={(layerId) => {
        const layer = frameLayers.find((item) => item.id === layerId)
        if (!layer) {
          return
        }

        if (layer.kind === "text") {
          onUpdateLayer(layerId, {
            visible: !resolveLayerVisible(layer),
          })
          return
        }

        if (layer.kind === "image") {
          onUpdateImageLayer(layerId, {
            visible: !resolveLayerVisible(layer),
          })
          return
        }

        onUpdateShapeLayer(layerId, {
          visible: !resolveLayerVisible(layer),
        })
      }}
      onRemoveLayer={(layerId) => {
        if (
          ui.selection.kind === "element" &&
          ui.selection.elementId === layerId
        ) {
          ui.selectPage(frameId)
        }

        onRemoveLayer(layerId)
      }}
    />
  )
}
