import { Layers } from "lucide-react"

import { LayerList } from "@/features/designer/components/layers/layer-list"
import { getLayersForFrame, type Layer } from "@/features/designer/model/layers"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"

type LayersPanelProps = {
  ui: DesignerUi
  frameId: string
  layers: Layer[]
  onReorder: (frameId: string, fromIndex: number, toIndex: number) => void
}

export function LayersPanel({
  ui,
  frameId,
  layers,
  onReorder,
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
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-muted-foreground">
        Top of the list draws above layers below.
      </p>
      <LayerList
        layers={frameLayers}
        onReorder={(fromIndex, toIndex) =>
          onReorder(frameId, fromIndex, toIndex)
        }
        selectedLayerId={selectedLayerId}
      />
    </div>
  )
}
