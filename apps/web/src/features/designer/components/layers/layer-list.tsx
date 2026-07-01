import { useState } from "react"
import {
  Circle,
  Eye,
  EyeOff,
  Image,
  Minus,
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

type LayerListProps = {
  layers: Layer[]
  onReorder: (fromIndex: number, toIndex: number) => void
  selectedLayerId?: string | null
  onSelectLayer?: (layerId: string) => void
  onToggleVisibility?: (layerId: string) => void
  onRemoveLayer?: (layerId: string) => void
}

const layerActionClassName = cn(
  "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
  "text-muted-foreground hover:bg-muted hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
)

function layerIcon(layer: Layer): LucideIcon {
  if (layer.kind === "text") {
    return Type
  }

  if (layer.kind === "image") {
    return Image
  }

  switch (layer.shapeType) {
    case "circle":
      return Circle
    case "triangle":
      return Triangle
    case "line":
      return Minus
    case "square":
    default:
      return Square
  }
}

export function LayerList({
  layers,
  onReorder,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onRemoveLayer,
}: LayerListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  function resetDragState() {
    setDragIndex(null)
    setDropIndex(null)
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      resetDragState()
      return
    }

    onReorder(dragIndex, targetIndex)
    resetDragState()
  }

  return (
    <ul className="flex flex-col gap-1" role="listbox" aria-label="Layers">
      {layers.map((layer, index) => {
        const isDragging = dragIndex === index
        const isDropTarget = dropIndex === index && dragIndex !== index
        const isSelected = selectedLayerId === layer.id
        const isVisible = resolveLayerVisible(layer)
        const LayerIcon = layerIcon(layer)

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
              !isVisible && "opacity-70"
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setDropIndex(index)
            }}
            onDragLeave={() => {
              if (dropIndex === index) {
                setDropIndex(null)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(index)
            }}
          >
            <div className="flex items-center gap-1 px-1.5 py-1">
              <button
                type="button"
                draggable
                aria-label={`Reorder ${layer.name}`}
                className={cn(
                  layerActionClassName,
                  "cursor-grab active:cursor-grabbing",
                  isSelected &&
                    "text-active-foreground hover:bg-active-foreground/10"
                )}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", layer.id)
                  setDragIndex(index)
                }}
                onDragEnd={resetDragState}
              >
                <LayerIcon className="size-3.5" aria-hidden />
              </button>

              <button
                type="button"
                className={cn(
                  "min-w-0 flex-1 truncate px-1 py-0.5 text-left text-xs font-medium",
                  isSelected ? "text-active-foreground" : "",
                  !isVisible && "text-muted-foreground"
                )}
                onClick={() => onSelectLayer?.(layer.id)}
              >
                {layer.name}
              </button>

              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/layer:opacity-100 focus-within:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
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
                      aria-label={`Delete ${layer.name}`}
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
                  <TooltipContent side="left">Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
