import { useEffect, useRef } from "react"

import { CanvasStage } from "@/features/designer/components/layout/canvas-stage"
import {
  AddFrameButton,
  DuplicateFrameButton,
  FrameNameField,
  FrameOrderButtons,
  RemoveFrameButton,
} from "@/features/designer/components/layout/page-controls"
import { useStageFit } from "@/features/designer/hooks/use-stage-fit"
import { useScrollRevealScrollbar } from "@/features/designer/hooks/use-scroll-reveal-scrollbar"
import {
  frameHasElements,
  type DesignerFrame,
} from "@/features/designer/model/frames"
import type { Layer } from "@/features/designer/model/layers"
import { getMaxExportWidthPx } from "@/features/designer/lib/dimensions"
import { ZOOM_WHEEL_SENSITIVITY } from "@/features/designer/model/ui-types"

type CanvasViewportProps = {
  frames: DesignerFrame[]
  activeFrameId: string
  layers: Layer[]
  getCanvasRef: (frameId: string) => (node: HTMLCanvasElement | null) => void
  displayScale: number
  onFitScaleChange: (scale: number) => void
  onZoomScaleChange: (scale: number) => void
  onSelectFrame: (frameId: string) => void
  onFrameNameChange: (name: string) => void
  onAddFrame: () => string
  onRemoveFrame: (frameId: string) => void
  onDuplicateFrame: (frameId: string) => string
  onMoveFrame: (frameId: string, direction: "up" | "down") => void
  toolbarChromeRef: React.RefObject<HTMLElement | null>
  zoomChromeRef: React.RefObject<HTMLElement | null>
}

export function CanvasViewport({
  frames,
  activeFrameId,
  layers,
  getCanvasRef,
  displayScale,
  onFitScaleChange,
  onZoomScaleChange,
  onSelectFrame,
  onFrameNameChange,
  onAddFrame,
  onRemoveFrame,
  onDuplicateFrame,
  onMoveFrame,
  toolbarChromeRef,
  zoomChromeRef,
}: CanvasViewportProps) {
  const canReorderFrames = frames.length > 1
  const displayScaleRef = useRef(displayScale)
  const activeFrameRef = useRef<HTMLDivElement>(null)
  const fitExportWidthPx = getMaxExportWidthPx(
    frames.map((frame) => frame.settings)
  )
  const { viewportRef, scrollRef, safeAreaInset } = useStageFit({
    exportWidthPx: fitExportWidthPx,
    onFitScaleChange,
    toolbarChromeRef,
    zoomChromeRef,
  })

  useScrollRevealScrollbar(scrollRef)

  useEffect(() => {
    displayScaleRef.current = displayScale
  }, [displayScale])

  useEffect(() => {
    const frameEl = activeFrameRef.current
    const scrollEl = scrollRef.current
    if (!frameEl || !scrollEl) {
      return
    }

    const frameRect = frameEl.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    const isAbove = frameRect.top < scrollRect.top
    const isBelow = frameRect.bottom > scrollRect.bottom

    if (isAbove || isBelow) {
      frameEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [activeFrameId, scrollRef])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    function onWheel(event: WheelEvent) {
      const scrollEl = scrollRef.current
      const canScroll =
        scrollEl !== null && scrollEl.scrollHeight > scrollEl.clientHeight + 1

      if (canScroll && !event.ctrlKey && !event.metaKey) {
        return
      }

      event.preventDefault()

      const factor = Math.exp(-event.deltaY * ZOOM_WHEEL_SENSITIVITY)
      onZoomScaleChange(displayScaleRef.current * factor)
    }

    viewport.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      viewport.removeEventListener("wheel", onWheel)
    }
  }, [onZoomScaleChange, scrollRef, viewportRef])

  return (
    <div
      ref={viewportRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-transparent"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSelectFrame(activeFrameId)
        }
      }}
    >
      <div
        ref={scrollRef}
        className="absolute inset-0 scrollbar-thin overflow-y-auto overscroll-contain bg-transparent"
        style={{ padding: safeAreaInset }}
      >
        <div className="flex min-h-full flex-col items-center">
          <div className="flex flex-col items-center gap-3">
            {frames.map((frame, index) => {
              const isActive = frame.id === activeFrameId

              return (
                <div
                  key={frame.id}
                  ref={isActive ? activeFrameRef : undefined}
                  className="group/frame flex flex-col items-start gap-3"
                >
                  <div className="flex max-w-full items-center gap-1 self-stretch">
                    <FrameNameField
                      pageName={frame.name}
                      onPageNameChange={onFrameNameChange}
                      onFocus={() => onSelectFrame(frame.id)}
                      className="min-w-0 flex-1"
                    />
                    <DuplicateFrameButton
                      frameName={frame.name}
                      onDuplicate={() => onDuplicateFrame(frame.id)}
                    />
                    {canReorderFrames ? (
                      <>
                        <FrameOrderButtons
                          frameName={frame.name}
                          canMoveUp={index > 0}
                          canMoveDown={index < frames.length - 1}
                          onMoveUp={() => onMoveFrame(frame.id, "up")}
                          onMoveDown={() => onMoveFrame(frame.id, "down")}
                        />
                        <RemoveFrameButton
                          frameName={frame.name}
                          hasElements={frameHasElements(frame, layers)}
                          onRemove={() => onRemoveFrame(frame.id)}
                        />
                      </>
                    ) : null}
                  </div>
                  <CanvasStage
                    settings={frame.settings}
                    registerCanvas={getCanvasRef(frame.id)}
                    displayScale={displayScale}
                    isPageSelected={isActive}
                    onSelectPage={() => onSelectFrame(frame.id)}
                  />
                </div>
              )
            })}
            <AddFrameButton onAddFrame={onAddFrame} />
          </div>
        </div>
      </div>
    </div>
  )
}
