import type { Ref } from "react"
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react"

import { RemoveFrameButton } from "@/features/designer/components/layout/page-controls"
import { ZoomControls } from "@/features/designer/components/layout/zoom-controls"
import type { DesignerFrame } from "@/features/designer/model/frames"
import type { ZoomMode } from "@/features/designer/model/ui-types"
import {
  SlidingNavIndicator,
  SlidingNavItem,
} from "@workspace/ui/components/settings/sliding-nav-indicator"
import { settingsControlHeightClassName } from "@workspace/ui/components/settings/settings-field-styles"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

const pageTabTriggerClassName =
  "inline-flex h-full min-h-0 shrink-0 items-center justify-center rounded-squircle border-0 bg-transparent py-0 text-xs font-medium leading-none tabular-nums shadow-none outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"

type BottomStageBarProps = {
  frames: DesignerFrame[]
  activeFrameId: string
  effectiveScale: number
  zoomMode: ZoomMode
  onSelectFrame: (frameId: string) => void
  onAddFrame: () => void
  onDuplicateFrame: () => void
  onRemovePage: () => void
  canRemovePage: boolean
  hasPageElements: boolean
  activeFrameName: string
  onZoomScaleChange: (scale: number) => void
  onZoomFit: () => void
  fitChromeRef?: Ref<HTMLDivElement>
}

export function BottomStageBar({
  frames,
  activeFrameId,
  effectiveScale,
  zoomMode,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onRemovePage,
  canRemovePage,
  hasPageElements,
  activeFrameName,
  onZoomScaleChange,
  onZoomFit,
  fitChromeRef,
}: BottomStageBarProps) {
  const activeIndex = frames.findIndex((frame) => frame.id === activeFrameId)
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < frames.length - 1
  const duplicateLabel = activeFrameName.trim() || "page"

  function goToPrev() {
    if (!canGoPrev) {
      return
    }

    onSelectFrame(frames[activeIndex - 1].id)
  }

  function goToNext() {
    if (!canGoNext) {
      return
    }

    onSelectFrame(frames[activeIndex + 1].id)
  }

  return (
    <div ref={fitChromeRef} className="relative z-20 shrink-0">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label="Previous page"
                disabled={!canGoPrev}
                onClick={goToPrev}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous page</TooltipContent>
          </Tooltip>

          <div className="flex min-w-0 scrollbar-thin overflow-x-auto">
            <div
              className={cn(
                "rounded-squircle flex items-stretch bg-muted p-0.5 [corner-shape:round]",
                settingsControlHeightClassName
              )}
              role="tablist"
              aria-label="Pages"
            >
              <SlidingNavIndicator
                activeIndex={activeIndex >= 0 ? activeIndex : null}
                variant="segmented"
                className="flex h-full min-h-0 items-stretch"
              >
                {frames.map((frame, index) => {
                  const isActive = frame.id === activeFrameId
                  const pageNumber = index + 1
                  const isSingleDigit = pageNumber < 10
                  const label = frame.name.trim() || `Page ${pageNumber}`

                  return (
                    <SlidingNavItem
                      key={frame.id}
                      className="flex h-full min-h-0 items-stretch"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={label}
                            className={cn(
                              pageTabTriggerClassName,
                              isSingleDigit ? "aspect-square px-0" : "px-2.5",
                              isActive
                                ? "text-foreground"
                                : "text-foreground/70"
                            )}
                            onClick={() => onSelectFrame(frame.id)}
                          >
                            {pageNumber}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    </SlidingNavItem>
                  )
                })}
              </SlidingNavIndicator>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label="Next page"
                disabled={!canGoNext}
                onClick={goToNext}
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next page</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label="Add page"
                onClick={onAddFrame}
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add page</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                aria-label={`Duplicate ${duplicateLabel}`}
                onClick={onDuplicateFrame}
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate page</TooltipContent>
          </Tooltip>

          {canRemovePage ? (
            <RemoveFrameButton
              frameName={duplicateLabel}
              hasElements={hasPageElements}
              onRemove={onRemovePage}
              className="shrink-0 text-muted-foreground opacity-100 focus-visible:opacity-100"
            />
          ) : null}
        </div>

        <ZoomControls
          effectiveScale={effectiveScale}
          zoomMode={zoomMode}
          onZoomScaleChange={onZoomScaleChange}
          onZoomFit={onZoomFit}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
