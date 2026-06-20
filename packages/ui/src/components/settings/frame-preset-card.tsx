import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type FramePresetCardProps = {
  label: string
  tooltip: string
  aspectRatio: number
  active?: boolean
  onSelect: () => void
}

export function FramePresetCard({
  label,
  tooltip,
  aspectRatio,
  active = false,
  onSelect,
}: FramePresetCardProps) {
  const previewWidth = aspectRatio >= 1 ? 100 : Math.round(100 * aspectRatio)
  const previewHeight = aspectRatio >= 1 ? Math.round(100 / aspectRatio) : 100

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex aspect-square w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-left transition-colors [corner-shape:round]",
            active
              ? "control-selected"
              : "border-border bg-background hover:bg-muted/50"
          )}
        >
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <div
              className={cn(
                "rounded-sm border border-foreground/30 bg-foreground/5",
                active && "border-active-foreground/40 bg-active-foreground/10"
              )}
              style={{
                width: `${previewWidth * 0.36}px`,
                height: `${previewHeight * 0.36}px`,
              }}
            />
          </div>
          <span className="w-full text-center text-xs leading-none font-medium">
            {label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
