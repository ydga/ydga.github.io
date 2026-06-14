import { useCallback, useEffect, useRef, useState } from "react"

import type { GradientStop } from "@/features/designer/model/types"
import {
  addGradientStopAtPosition,
  axisPercentFromStopPosition,
  clampStopPositionBetweenNeighbors,
  getStopCanvasPosition,
  normalizeGradientStops,
  projectOntoGradientAxis,
  sortGradientStops,
  stopPositionFromAxisPercent,
} from "@/features/designer/lib/gradient-stops"
import { ColorPickerPanel } from "@workspace/ui/components/settings/color-picker"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

const LINE_HIT_TOLERANCE_PX = 16
const MIN_ADD_GAP = 2
const DRAG_THRESHOLD_PX = 4
const COLOR_PICKER_OPEN_DELAY_MS = 180

type GradientCanvasOverlayProps = {
  boundsRef: React.RefObject<HTMLElement | null>
  stops: GradientStop[]
  startX: number
  startY: number
  endX: number
  endY: number
  onStopsChange: (stops: GradientStop[]) => void
  onStartChange: (x: number, y: number) => void
  onEndChange: (x: number, y: number) => void
}

function pointerToPercent(
  clientX: number,
  clientY: number,
  bounds: DOMRect
): { x: number; y: number } {
  return {
    x: clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100),
    y: clamp(((clientY - bounds.top) / bounds.height) * 100, 0, 100),
  }
}

function axisEndpointsPx(
  bounds: DOMRect,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  return {
    x1: bounds.left + (startX / 100) * bounds.width,
    y1: bounds.top + (startY / 100) * bounds.height,
    x2: bounds.left + (endX / 100) * bounds.width,
    y2: bounds.top + (endY / 100) * bounds.height,
  }
}

function distanceToSegmentPx(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1)
  }

  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1)
  const closestX = x1 + t * dx
  const closestY = y1 + t * dy

  return Math.hypot(px - closestX, py - closestY)
}

function isNearExistingStop(
  stops: GradientStop[],
  axisPercent: number
): boolean {
  return stops.some(
    (stop) =>
      Math.abs(
        axisPercentFromStopPosition(stop.position, stops) - axisPercent
      ) < MIN_ADD_GAP
  )
}

export function GradientCanvasOverlay({
  boundsRef,
  stops,
  startX,
  startY,
  endX,
  endY,
  onStopsChange,
  onStartChange,
  onEndChange,
}: GradientCanvasOverlayProps) {
  const stopsRef = useRef(stops)
  const axisRef = useRef({ startX, startY, endX, endY })
  const colorPickerTimerRef = useRef<number | null>(null)
  const sortedStops = sortGradientStops(normalizeGradientStops(stops))
  const [activeStopId, setActiveStopId] = useState<string>(
    () => sortedStops[0]?.id ?? ""
  )
  const [colorPickerStopId, setColorPickerStopId] = useState<string | null>(
    null
  )

  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  useEffect(() => {
    axisRef.current = { startX, startY, endX, endY }
  }, [endX, endY, startX, startY])

  useEffect(() => {
    if (!stops.some((stop) => stop.id === activeStopId)) {
      setActiveStopId(sortGradientStops(stops)[0]?.id ?? "")
    }
  }, [activeStopId, stops])

  useEffect(() => {
    if (
      colorPickerStopId &&
      !stops.some((stop) => stop.id === colorPickerStopId)
    ) {
      setColorPickerStopId(null)
    }
  }, [colorPickerStopId, stops])

  useEffect(() => {
    return () => {
      if (colorPickerTimerRef.current !== null) {
        window.clearTimeout(colorPickerTimerRef.current)
      }
    }
  }, [])

  const clearColorPickerTimer = () => {
    if (colorPickerTimerRef.current !== null) {
      window.clearTimeout(colorPickerTimerRef.current)
      colorPickerTimerRef.current = null
    }
  }

  const closeColorPicker = () => {
    clearColorPickerTimer()
    setColorPickerStopId(null)
  }

  const scheduleColorPicker = (stopId: string) => {
    clearColorPickerTimer()
    colorPickerTimerRef.current = window.setTimeout(() => {
      colorPickerTimerRef.current = null
      setColorPickerStopId(stopId)
    }, COLOR_PICKER_OPEN_DELAY_MS)
  }

  const updateStops = useCallback(
    (nextStops: GradientStop[]) => {
      onStopsChange(normalizeGradientStops(nextStops))
    },
    [onStopsChange]
  )

  const updateStopColor = useCallback(
    (stopId: string, color: string) => {
      updateStops(
        stopsRef.current.map((stop) =>
          stop.id === stopId ? { ...stop, color } : stop
        )
      )
    },
    [updateStops]
  )

  const removeStop = useCallback(
    (stopId: string) => {
      if (stops.length <= 2) {
        return
      }

      closeColorPicker()
      const nextStops = stops.filter((stop) => stop.id !== stopId)
      updateStops(nextStops)
      if (activeStopId === stopId) {
        setActiveStopId(nextStops[0]?.id ?? "")
      }
    },
    [activeStopId, stops, updateStops]
  )

  const handleLinePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    closeColorPicker()

    const bounds = boundsRef.current?.getBoundingClientRect()
    if (!bounds) {
      return
    }

    const { x1, y1, x2, y2 } = axisEndpointsPx(
      bounds,
      startX,
      startY,
      endX,
      endY
    )
    const distance = distanceToSegmentPx(
      event.clientX,
      event.clientY,
      x1,
      y1,
      x2,
      y2
    )

    if (distance > LINE_HIT_TOLERANCE_PX) {
      return
    }

    const { x, y } = pointerToPercent(event.clientX, event.clientY, bounds)
    const axisPercent = projectOntoGradientAxis(
      x,
      y,
      startX,
      startY,
      endX,
      endY
    )

    if (isNearExistingStop(stopsRef.current, axisPercent)) {
      return
    }

    const position = stopPositionFromAxisPercent(axisPercent, stopsRef.current)
    const { stops: nextStops, stopId } = addGradientStopAtPosition(
      stopsRef.current,
      position
    )
    updateStops(nextStops)
    setActiveStopId(stopId)
  }

  const startDraggingStop = (
    stopId: string,
    role: "start" | "end" | "middle",
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    clearColorPickerTimer()
    setActiveStopId(stopId)

    const pointerId = event.pointerId
    const startClientX = event.clientX
    const startClientY = event.clientY
    let dragged = false

    event.currentTarget.setPointerCapture(pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      if (!dragged) {
        const distance = Math.hypot(
          moveEvent.clientX - startClientX,
          moveEvent.clientY - startClientY
        )

        if (distance < DRAG_THRESHOLD_PX) {
          return
        }

        dragged = true
        closeColorPicker()
      }

      const bounds = boundsRef.current?.getBoundingClientRect()
      if (!bounds) {
        return
      }

      const { x, y } = pointerToPercent(
        moveEvent.clientX,
        moveEvent.clientY,
        bounds
      )

      if (role === "start") {
        axisRef.current = { ...axisRef.current, startX: x, startY: y }
        onStartChange(x, y)
        return
      }

      if (role === "end") {
        axisRef.current = { ...axisRef.current, endX: x, endY: y }
        onEndChange(x, y)
        return
      }

      const currentStops = stopsRef.current
      const {
        startX: axisStartX,
        startY: axisStartY,
        endX: axisEndX,
        endY: axisEndY,
      } = axisRef.current
      const axisPercent = projectOntoGradientAxis(
        x,
        y,
        axisStartX,
        axisStartY,
        axisEndX,
        axisEndY
      )
      const rawPosition = stopPositionFromAxisPercent(axisPercent, currentStops)

      updateStops(
        currentStops.map((stop) =>
          stop.id === stopId
            ? {
                ...stop,
                position: clampStopPositionBetweenNeighbors(
                  currentStops,
                  stopId,
                  rawPosition
                ),
              }
            : stop
        )
      )
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return
      }

      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)

      if (!dragged) {
        scheduleColorPicker(stopId)
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  const leadingStopId = sortedStops[0]?.id
  const trailingStopId = sortedStops[sortedStops.length - 1]?.id
  const swatchClassName =
    "pointer-events-auto absolute z-10 size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 shadow-sm active:cursor-grabbing"

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="pointer-events-auto absolute inset-0 z-0"
        onPointerDown={handleLinePointerDown}
      />

      <svg
        className="pointer-events-none absolute inset-0 size-full mix-blend-difference"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#ffffff"
          strokeWidth={2.8}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {sortedStops.map((stop, index) => {
        const isActive = stop.id === activeStopId
        const isLeading = stop.id === leadingStopId
        const isTrailing = stop.id === trailingStopId
        const role = isLeading ? "start" : isTrailing ? "end" : "middle"
        const { x, y } = isLeading
          ? { x: startX, y: startY }
          : isTrailing
            ? { x: endX, y: endY }
            : getStopCanvasPosition(
                stop,
                startX,
                startY,
                endX,
                endY,
                sortedStops
              )
        const pickerSide = y < 35 ? "bottom" : "top"

        return (
          <Popover
            key={stop.id}
            modal={false}
            open={colorPickerStopId === stop.id}
            onOpenChange={(open) => {
              if (!open) {
                closeColorPicker()
              }
            }}
          >
            <PopoverAnchor asChild>
              <button
                type="button"
                aria-label={`Gradient color ${index + 1}`}
                aria-pressed={isActive}
                className={cn(
                  swatchClassName,
                  isActive
                    ? "scale-110 border-foreground ring-2 ring-ring/30"
                    : "border-white"
                )}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: stop.color,
                }}
                onPointerDown={(event) =>
                  startDraggingStop(stop.id, role, event)
                }
                onDoubleClick={(event) => {
                  if (role === "middle") {
                    event.preventDefault()
                    event.stopPropagation()
                    removeStop(stop.id)
                  }
                }}
              />
            </PopoverAnchor>
            <PopoverContent
              side={pickerSide}
              align="center"
              sideOffset={10}
              className="aspect-square w-44 gap-0 rounded-3xl p-2.5"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <ColorPickerPanel
                value={stop.color}
                onChange={(color) => updateStopColor(stop.id, color)}
              />
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
