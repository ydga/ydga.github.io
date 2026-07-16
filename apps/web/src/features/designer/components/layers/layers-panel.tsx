import { useMemo, useState } from "react"
import { FolderPlus, Layers } from "lucide-react"

import { LayerList } from "@/features/designer/components/layers/layer-list"
import {
  getLayerListRows,
  getLayersForFrame,
  isDrawableLayer,
  type GroupLayerUpdatePatch,
  type Layer,
  type ShapeLayerUpdatePatch,
  type TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { resolveLayerVisible } from "@/features/designer/model/shape-layer-style"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type LayersPanelProps = {
  ui: DesignerUi
  frameId: string
  layers: Layer[]
  onReorder: (frameId: string, fromLayerId: string, toLayerId: string) => void
  onUpdateLayer: (layerId: string, patch: TextLayerUpdatePatch) => void
  onUpdateShapeLayer: (layerId: string, patch: ShapeLayerUpdatePatch) => void
  onUpdateGroupLayer: (layerId: string, patch: GroupLayerUpdatePatch) => void
  onRenameLayer: (layerId: string, name: string) => void
  onGroupLayers: (frameId: string, layerIds: string[]) => string | null
  onUngroupLayer: (groupId: string) => void
  onRemoveLayer: (layerId: string) => void
}

export function LayersPanel({
  ui,
  frameId,
  layers,
  onReorder,
  onUpdateLayer,
  onUpdateShapeLayer,
  onUpdateGroupLayer,
  onRenameLayer,
  onGroupLayers,
  onUngroupLayer,
  onRemoveLayer,
}: LayersPanelProps) {
  const frameLayers = getLayersForFrame(layers, frameId)
  const rows = useMemo(
    () => getLayerListRows(layers, frameId),
    [frameId, layers]
  )
  const canvasSelectedId =
    ui.selection.kind === "element" ? ui.selection.elementId : null
  const [listSelectedIds, setListSelectedIds] = useState<string[]>([])

  const selectedLayerIds = useMemo(() => {
    const validList = listSelectedIds.filter((id) =>
      frameLayers.some((layer) => layer.id === id)
    )
    // Multi-select only sticks while it still includes the canvas selection.
    if (
      validList.length > 1 &&
      (!canvasSelectedId || validList.includes(canvasSelectedId))
    ) {
      return validList
    }
    if (canvasSelectedId) {
      return [canvasSelectedId]
    }
    return validList
  }, [canvasSelectedId, frameLayers, listSelectedIds])

  const canGroup =
    selectedLayerIds.filter((id) => {
      const layer = frameLayers.find((item) => item.id === id)
      return layer && isDrawableLayer(layer) && !layer.parentId
    }).length >= 2

  if (frameLayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Layers className="size-4" aria-hidden />
        </div>
        <p className="text-xs font-medium text-foreground">No layers yet</p>
        <p className="max-w-[220px] text-[11px] leading-relaxed text-muted-foreground">
          Elements you add to the canvas will appear here. Drag layers to change
          stacking order, double-click to rename, and multi-select to group.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
              disabled={!canGroup}
              onClick={() => {
                const groupId = onGroupLayers(frameId, selectedLayerIds)
                if (groupId) {
                  setListSelectedIds([groupId])
                }
              }}
            >
              <FolderPlus className="size-3" aria-hidden />
              Group
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Group selected layers (⌘/Ctrl-click to multi-select)
          </TooltipContent>
        </Tooltip>
      </div>

      <LayerList
        rows={rows}
        selectedLayerIds={selectedLayerIds}
        onReorder={(fromLayerId, toLayerId) =>
          onReorder(frameId, fromLayerId, toLayerId)
        }
        onSelectLayer={(layerId, options) => {
          const layer = frameLayers.find((item) => item.id === layerId)
          if (!layer) {
            return
          }

          if (layer.kind === "group") {
            setListSelectedIds([layerId])
            return
          }

          const rowIds = rows.map((row) => row.layer.id)

          if (options?.range && selectedLayerIds[0]) {
            const anchor = selectedLayerIds[0]
            const from = rowIds.indexOf(anchor)
            const to = rowIds.indexOf(layerId)
            if (from >= 0 && to >= 0) {
              const [start, end] = from < to ? [from, to] : [to, from]
              setListSelectedIds(rowIds.slice(start, end + 1))
            } else {
              setListSelectedIds([layerId])
            }
          } else if (options?.additive) {
            setListSelectedIds((current) => {
              const base =
                current.length > 0 &&
                (!canvasSelectedId || current.includes(canvasSelectedId))
                  ? current
                  : canvasSelectedId
                    ? [canvasSelectedId]
                    : []
              return base.includes(layerId)
                ? base.filter((id) => id !== layerId)
                : [...base, layerId]
            })
          } else {
            setListSelectedIds([layerId])
          }

          // Select on canvas without leaving the layers panel.
          ui.selectElement(frameId, layerId, { preservePanelMode: true })
        }}
        onToggleVisibility={(layerId) => {
          const layer = frameLayers.find((item) => item.id === layerId)
          if (!layer) {
            return
          }

          const nextVisible = !resolveLayerVisible(layer)

          if (layer.kind === "text") {
            onUpdateLayer(layerId, { visible: nextVisible })
            return
          }
          if (layer.kind === "shape") {
            onUpdateShapeLayer(layerId, { visible: nextVisible })
            return
          }
          onUpdateGroupLayer(layerId, { visible: nextVisible })
          // Cascade visibility to children for immediate canvas feedback.
          for (const child of frameLayers) {
            if (isDrawableLayer(child) && child.parentId === layerId) {
              if (child.kind === "text") {
                onUpdateLayer(child.id, { visible: nextVisible })
              } else {
                onUpdateShapeLayer(child.id, { visible: nextVisible })
              }
            }
          }
        }}
        onRenameLayer={onRenameLayer}
        onToggleGroupCollapsed={(groupId) => {
          const layer = frameLayers.find((item) => item.id === groupId)
          if (!layer || layer.kind !== "group") {
            return
          }
          onUpdateGroupLayer(groupId, { collapsed: !layer.collapsed })
        }}
        onRemoveLayer={(layerId) => {
          const layer = frameLayers.find((item) => item.id === layerId)
          if (layer?.kind === "group") {
            onUngroupLayer(layerId)
            setListSelectedIds((current) =>
              current.filter((id) => id !== layerId)
            )
            return
          }

          if (
            ui.selection.kind === "element" &&
            ui.selection.elementId === layerId
          ) {
            ui.selectPage(frameId)
          }

          setListSelectedIds((current) =>
            current.filter((id) => id !== layerId)
          )
          onRemoveLayer(layerId)
        }}
      />
    </div>
  )
}
