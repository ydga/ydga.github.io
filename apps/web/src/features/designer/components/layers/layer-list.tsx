import { useEffect, useRef, useState } from "react"
import {
  Circle,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  Hexagon,
  Minus,
  PenTool,
  Square,
  Trash2,
  Triangle,
  Type,
} from "lucide-react"

import type { Layer } from "@/features/designer/model/layers"
import { resolveLayerVisible } from "@/features/designer/model/shape-layer-style"
import type { LucideIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

export type LayerListRow = {
  layer: Layer
  depth: number
}

type LayerListProps = {
  rows: LayerListRow[]
  onReorder: (fromLayerId: string, toLayerId: string) => void
  selectedLayerIds: string[]
  onSelectLayer: (
    layerId: string,
    options?: { additive?: boolean; range?: boolean }
  ) => void
  onToggleVisibility?: (layerId: string) => void
  onRemoveLayer?: (layerId: string) => void
  onRenameLayer?: (layerId: string, name: string) => void
  onToggleGroupCollapsed?: (groupId: string) => void
}

const layerActionClassName = cn(
  "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
  "text-muted-foreground hover:bg-muted hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
)

function layerIcon(layer: Layer): LucideIcon {
  if (layer.kind === "group") {
    return layer.collapsed ? Folder : FolderOpen
  }
  if (layer.kind === "text") {
    return Type
  }

  switch (layer.shapeType) {
    case "circle":
      return Circle
    case "triangle":
      return Triangle
    case "line":
      return Minus
    case "pen":
      return PenTool
    case "polygon":
      return Hexagon
    case "square":
    default:
      return Square
  }
}

export function LayerList({
  rows,
  onReorder,
  selectedLayerIds,
  onSelectLayer,
  onToggleVisibility,
  onRemoveLayer,
  onRenameLayer,
  onToggleGroupCollapsed,
}: LayerListProps) {
  const [dragLayerId, setDragLayerId] = useState<string | null>(null)
  const [dropLayerId, setDropLayerId] = useState<string | null>(null)
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingLayerId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [editingLayerId])

  function resetDragState() {
    setDragLayerId(null)
    setDropLayerId(null)
  }

  function commitRename() {
    if (!editingLayerId) {
      return
    }
    const next = editingName.trim()
    if (next) {
      onRenameLayer?.(editingLayerId, next)
    }
    setEditingLayerId(null)
    setEditingName("")
  }

  function handleDrop(targetLayerId: string) {
    if (!dragLayerId || dragLayerId === targetLayerId) {
      resetDragState()
      return
    }
    onReorder(dragLayerId, targetLayerId)
    resetDragState()
  }

  return (
    <ul className="flex flex-col gap-1" role="listbox" aria-label="Layers">
      {rows.map(({ layer, depth }) => {
        const isDragging = dragLayerId === layer.id
        const isDropTarget = dropLayerId === layer.id && dragLayerId !== layer.id
        const isSelected = selectedLayerIds.includes(layer.id)
        const isVisible = resolveLayerVisible(layer)
        const LayerIcon = layerIcon(layer)
        const isEditing = editingLayerId === layer.id

        return (
          <li
            key={layer.id}
            role="option"
            aria-selected={isSelected}
            className={cn(
              "group/layer rounded-xl border border-transparent transition-colors",
              isSelected ? "bg-active" : "bg-muted/40",
              isDropTarget && "border-dashed border-ring",
              isDragging && "opacity-50",
              !isVisible && "opacity-70",
              !isEditing && "cursor-pointer"
            )}
            style={{ marginLeft: depth > 0 ? depth * 12 : undefined }}
            onDragOver={(event) => {
              event.preventDefault()
              setDropLayerId(layer.id)
            }}
            onDragLeave={() => {
              if (dropLayerId === layer.id) {
                setDropLayerId(null)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(layer.id)
            }}
            onClick={(event) => {
              if (isEditing) {
                return
              }
              const target = event.target as HTMLElement
              if (
                target.closest("button") ||
                target.closest("input") ||
                target.closest("[data-layer-action]")
              ) {
                return
              }
              onSelectLayer(layer.id, {
                additive: event.metaKey || event.ctrlKey,
                range: event.shiftKey,
              })
            }}
          >
            <div className="flex items-center gap-1 px-1.5 py-1">
              <button
                type="button"
                draggable={!isEditing}
                aria-label={
                  layer.kind === "group"
                    ? `${layer.collapsed ? "Expand" : "Collapse"} ${layer.name}`
                    : `Reorder ${layer.name}`
                }
                className={cn(
                  layerActionClassName,
                  layer.kind === "group" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
                  isSelected &&
                    "text-active-foreground hover:bg-active-foreground/10"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  if (layer.kind === "group") {
                    onToggleGroupCollapsed?.(layer.id)
                  }
                }}
                onDragStart={(event) => {
                  if (isEditing) {
                    event.preventDefault()
                    return
                  }
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", layer.id)
                  setDragLayerId(layer.id)
                }}
                onDragEnd={resetDragState}
              >
                <LayerIcon className="size-3.5" aria-hidden />
              </button>

              {isEditing ? (
                <input
                  ref={renameInputRef}
                  value={editingName}
                  aria-label={`Rename ${layer.name}`}
                  className={cn(
                    "min-w-0 flex-1 rounded-md border border-ring/40 bg-background px-1 py-0.5 text-xs font-medium outline-none",
                    isSelected && "text-foreground"
                  )}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={commitRename}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === "Enter") {
                      event.preventDefault()
                      commitRename()
                    }
                    if (event.key === "Escape") {
                      event.preventDefault()
                      setEditingLayerId(null)
                      setEditingName("")
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={cn(
                    "min-w-0 flex-1 truncate px-1 py-0.5 text-left text-xs font-medium",
                    isSelected ? "text-active-foreground" : "",
                    !isVisible && "text-muted-foreground"
                  )}
                  onClick={(event) => {
                    onSelectLayer(layer.id, {
                      additive: event.metaKey || event.ctrlKey,
                      range: event.shiftKey,
                    })
                  }}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setEditingLayerId(layer.id)
                    setEditingName(layer.name)
                  }}
                >
                  {layer.name}
                </button>
              )}

              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/layer:opacity-100 focus-within:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-layer-action
                      aria-label={
                        isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`
                      }
                      aria-pressed={!isVisible}
                      className={cn(
                        layerActionClassName,
                        isSelected &&
                          "text-active-foreground hover:bg-active-foreground/10"
                      )}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleVisibility?.(layer.id)
                      }}
                    >
                      {isVisible ? (
                        <Eye className="size-3.5" aria-hidden />
                      ) : (
                        <EyeOff className="size-3.5" aria-hidden />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {isVisible ? "Hide" : "Show"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-layer-action
                      aria-label={
                        layer.kind === "group"
                          ? `Ungroup ${layer.name}`
                          : `Delete ${layer.name}`
                      }
                      className={cn(
                        layerActionClassName,
                        "hover:text-destructive",
                        isSelected &&
                          "text-active-foreground hover:bg-active-foreground/10"
                      )}
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemoveLayer?.(layer.id)
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {layer.kind === "group" ? "Ungroup" : "Delete"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
