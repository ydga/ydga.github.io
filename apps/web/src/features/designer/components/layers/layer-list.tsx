import { useState } from "react"
import { Type } from "lucide-react"

import type { Layer } from "@/features/designer/model/layers"
import { cn } from "@workspace/ui/lib/utils"

type LayerListProps = {
  layers: Layer[]
  onReorder: (fromIndex: number, toIndex: number) => void
  selectedLayerId?: string | null
  onSelectLayer?: (layerId: string) => void
}

export function LayerList({
  layers,
  onReorder,
  selectedLayerId,
  onSelectLayer,
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

        return (
          <li
            key={layer.id}
            role="option"
            aria-selected={isSelected}
            className={cn(
              "rounded-xl border border-transparent transition-colors",
              isSelected ? "bg-active" : "bg-muted/40",
              isDropTarget && "border-dashed border-ring",
              isDragging && "opacity-50"
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
            <div className="flex items-center gap-1.5 px-1.5 py-1">
              <button
                type="button"
                draggable
                aria-label={`Reorder ${layer.name}`}
                className={cn(
                  "flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md active:cursor-grabbing",
                  isSelected
                    ? "text-active-foreground hover:bg-active-foreground/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", layer.id)
                  setDragIndex(index)
                }}
                onDragEnd={resetDragState}
              >
                <Type className="size-3.5" aria-hidden />
              </button>

              <button
                type="button"
                className={cn(
                  "min-w-0 flex-1 truncate px-1 py-0.5 text-left text-xs font-medium",
                  isSelected ? "text-active-foreground" : ""
                )}
                onClick={() => onSelectLayer?.(layer.id)}
              >
                {layer.name}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
