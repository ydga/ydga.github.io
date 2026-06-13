import { cn } from "@workspace/ui/lib/utils"

type FramePresetCardProps = {
  label: string
  description: string
  aspectRatio: number
  active?: boolean
  onSelect: () => void
}

export function FramePresetCard({
  label,
  description,
  aspectRatio,
  active = false,
  onSelect,
}: FramePresetCardProps) {
  const previewWidth = aspectRatio >= 1 ? 100 : Math.round(100 * aspectRatio)
  const previewHeight = aspectRatio >= 1 ? Math.round(100 / aspectRatio) : 100

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border px-2 py-2.5 text-left transition-colors",
        active
          ? "border-ring bg-muted ring-1 ring-ring"
          : "border-border bg-background hover:bg-muted/50"
      )}
    >
      <div className="flex h-14 w-full items-center justify-center">
        <div
          className={cn(
            "rounded-sm border border-foreground/30 bg-foreground/5",
            active && "border-foreground/50 bg-foreground/10"
          )}
          style={{
            width: `${previewWidth * 0.36}px`,
            height: `${previewHeight * 0.36}px`,
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-0.5 text-center">
        <span className="text-xs leading-none font-medium">{label}</span>
        <span className="text-[10px] leading-none text-muted-foreground">
          {description}
        </span>
      </div>
    </button>
  )
}
