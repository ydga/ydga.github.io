import { Maximize2, Minus, Plus } from "lucide-react"

import type { ZoomMode } from "@/features/designer/model/ui-types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ZoomControlsProps = {
  effectiveScale: number
  zoomMode: ZoomMode
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  className?: string
}

export function ZoomControls({
  effectiveScale,
  zoomMode,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  className,
}: ZoomControlsProps) {
  const label = `${Math.round(effectiveScale * 100)}%`

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <Button
        type="button"
        variant="iconTile"
        size="icon-sm"
        aria-label="Zoom out"
        onClick={onZoomOut}
      >
        <Minus />
      </Button>
      <span className="min-w-14 text-center font-mono text-xs tabular-nums">
        {label}
      </span>
      <Button
        type="button"
        variant="iconTile"
        size="icon-sm"
        aria-label="Zoom in"
        onClick={onZoomIn}
      >
        <Plus />
      </Button>
      <Button
        type="button"
        variant={zoomMode === "fit" ? "secondary" : "ghost"}
        size="sm"
        className="h-8"
        onClick={onZoomFit}
      >
        <Maximize2 data-icon="inline-start" />
        Fit
      </Button>
    </div>
  )
}
