import { Plus, Trash2 } from "lucide-react"

import type { GradientStop } from "@/features/designer/model/types"
import {
  addGradientStop,
  normalizeGradientStops,
  sortGradientStops,
} from "@/features/designer/lib/gradient-stops"
import { Button } from "@workspace/ui/components/button"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
import { PanelIconTileButton } from "@workspace/ui/components/settings/panel-icon-tile-button"
import { panelIconClassName } from "@workspace/ui/components/settings/settings-field-styles"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type GradientStopSliderProps = {
  stops: GradientStop[]
  onStopsChange: (stops: GradientStop[]) => void
}

export function GradientStopSlider({
  stops,
  onStopsChange,
}: GradientStopSliderProps) {
  const sortedStops = sortGradientStops(normalizeGradientStops(stops))
  const canRemove = sortedStops.length > 2

  const commitStops = (nextStops: GradientStop[]) => {
    onStopsChange(normalizeGradientStops(nextStops))
  }

  const updateStop = (stopId: string, patch: Partial<GradientStop>) => {
    commitStops(
      stops.map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop))
    )
  }

  const removeStop = (stopId: string) => {
    if (stops.length <= 2) {
      return
    }

    commitStops(stops.filter((stop) => stop.id !== stopId))
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedStops.map((stop, index) => (
        <div key={stop.id} className="flex items-center gap-1.5">
          <ColorPickerField
            className="min-w-0 flex-1"
            value={stop.color}
            swatchLabel={`Gradient color ${index + 1}`}
            hexLabel={`Gradient color ${index + 1} hex`}
            onChange={(color) => updateStop(stop.id, { color })}
          />

          {canRemove ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <PanelIconTileButton
                  type="button"
                  aria-label={`Remove gradient color ${index + 1}`}
                  onClick={() => removeStop(stop.id)}
                >
                  <Trash2 className={panelIconClassName} />
                </PanelIconTileButton>
              </TooltipTrigger>
              <TooltipContent side="top">Remove color</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="xs"
        className="h-7 w-full"
        onClick={() => commitStops(addGradientStop(stops))}
      >
        <Plus className="size-3.5" />
        Add color
      </Button>
    </div>
  )
}
