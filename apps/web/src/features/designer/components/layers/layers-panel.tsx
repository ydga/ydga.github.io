import { useEffect, useMemo, useState } from "react"
import { FolderMinus, FolderPlus, Layers } from "lucide-react"

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

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  if (target.isContentEditable) {
    return true
  }
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
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

  const groupableIds = useMemo(
    () =>
      selectedLayerIds.filter((id) => {
        const layer = frameLayers.find((item) => item.id === id)
        return layer && isDrawableLayer(layer) && !layer.parentId
      }),
    [frameLayers, selectedLayerIds]
  )
  const canGroup = groupableIds.length >= 2

  const ungroupableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const id of selectedLayerIds) {
      const layer = frameLayers.find((item) => item.id === id)
      if (!layer) {
        continue
      }
      if (layer.kind === "group") {
        ids.add(layer.id)
        continue
      }
      if (isDrawableLayer(layer) && layer.parentId) {
        ids.add(layer.parentId)
      }
    }
    return [...ids]
  }, [frameLayers, selectedLayerIds])
  const canUngroup = ungroupableIds.length > 0

  function groupSelection() {
    if (!canGroup) {
      return
    }
    const groupId = onGroupLayers(frameId, groupableIds)
    if (groupId) {
      setListSelectedIds([groupId])
    }
  }

  function ungroupSelection() {
    if (!canUngroup) {
      return
    }
    for (const groupId of ungroupableIds) {
      onUngroupLayer(groupId)
    }
    setListSelectedIds((current) =>
      current.filter((id) => !ungroupableIds.includes(id))
    )
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return
      }
      if (
        !event.shiftKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return
      }

      const key = event.key.toLowerCase()

      // Shift+G groups the current multi-selection.
      if (key === "g") {
        if (groupableIds.length < 2) {
          return
        }
        event.preventDefault()
        const groupId = onGroupLayers(frameId, groupableIds)
        if (groupId) {
          setListSelectedIds([groupId])
        }
        return
      }

      // Shift+U ungroups the selected group (or a child's parent group).
      if (key === "u") {
        if (ungroupableIds.length === 0) {
          return
        }
        event.preventDefault()
        for (const groupId of ungroupableIds) {
          onUngroupLayer(groupId)
        }
        setListSelectedIds((current) =>
          current.filter((id) => !ungroupableIds.includes(id))
        )
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [frameId, groupableIds, onGroupLayers, onUngroupLayer, ungroupableIds])

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
      <div className="flex items-center justify-end gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
              disabled={!canGroup}
              onClick={groupSelection}
            >
              <FolderPlus className="size-3" aria-hidden />
              Group
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Group selected layers (⇧G)
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
              disabled={!canUngroup}
              onClick={ungroupSelection}
            >
              <FolderMinus className="size-3" aria-hidden />
              Ungroup
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Ungroup selected (⇧U)
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
