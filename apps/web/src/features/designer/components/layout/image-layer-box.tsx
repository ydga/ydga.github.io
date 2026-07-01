import { useRef, useState } from "react"

import type {
  ImageLayer,
  ImageLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsToStyle } from "@/features/designer/lib/background-style"
import {
  imageLayerHasImage,
  resolveImageLayerFill,
  resolveImageLayerOpacity,
} from "@/features/designer/model/image-layer-style"
import {
  SNAP_THRESHOLD_TRIM_PX,
  snapLayerBoxTrimPx,
  type ActiveSnapGuideLines,
} from "@/features/designer/lib/guide-snap"
import { cn } from "@workspace/ui/lib/utils"

const MIN_W_TRIM = 8
const MIN_H_TRIM = 8
const HANDLE_STICK_OUT = "0.5rem / 6"

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

type DragSession =
  | {
      kind: "move"
      pointerId: number
      trimStartX: number
      trimStartY: number
      startX: number
      startY: number
      startW: number
      startH: number
    }
  | {
      kind: "resize"
      pointerId: number
      handle: ResizeHandle
      startX: number
      startY: number
      startW: number
      startH: number
    }

type ImageLayerBoxProps = {
  layer: ImageLayer
  displayScale: number
  trimWidthPx: number
  trimHeightPx: number
  snapGuideXs?: readonly number[]
  snapGuideYs?: readonly number[]
  snapThresholdTrimPx?: number
  onActiveSnapGuidesChange?: (guides: ActiveSnapGuideLines | null) => void
  isSelected: boolean
  zIndex: number
  getFrameElement: () => HTMLElement | null
  onUpdate: (patch: ImageLayerUpdatePatch) => void
  onSelect: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clientToTrim(
  frameElement: HTMLElement | null,
  clientX: number,
  clientY: number,
  displayScale: number
) {
  if (!frameElement) {
    return { x: 0, y: 0 }
  }
  const rect = frameElement.getBoundingClientRect()
  return {
    x: (clientX - rect.left) / displayScale,
    y: (clientY - rect.top) / displayScale,
  }
}

function applyEdgeResize(
  handle: "n" | "s" | "e" | "w",
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number },
  trimW: number,
  trimH: number
): { x: number; y: number; w: number; h: number } {
  const { x: sx, y: sy, w: sw, h: sh } = start
  const right = sx + sw
  const bottom = sy + sh

  switch (handle) {
    case "e": {
      const w = clamp(px - sx, MIN_W_TRIM, trimW - sx)
      return { x: sx, y: sy, w, h: sh }
    }
    case "w": {
      const newLeft = clamp(px, 0, right - MIN_W_TRIM)
      const w = right - newLeft
      return { x: newLeft, y: sy, w, h: sh }
    }
    case "s": {
      const h = clamp(py - sy, MIN_H_TRIM, trimH - sy)
      return { x: sx, y: sy, w: sw, h }
    }
    case "n": {
      const newTop = clamp(py, 0, bottom - MIN_H_TRIM)
      const h = bottom - newTop
      return { x: sx, y: newTop, w: sw, h }
    }
  }
}

function applyCornerResize(
  handle: "nw" | "ne" | "sw" | "se",
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number },
  trimW: number,
  trimH: number
): { x: number; y: number; w: number; h: number } {
  const edge =
    handle === "nw" || handle === "sw"
      ? applyEdgeResize("w", px, py, start, trimW, trimH)
      : applyEdgeResize("e", px, py, start, trimW, trimH)
  const vertical =
    handle === "nw" || handle === "ne"
      ? applyEdgeResize("n", px, py, edge, trimW, trimH)
      : applyEdgeResize("s", px, py, edge, trimW, trimH)
  return vertical
}

const HANDLES: Array<{
  id: ResizeHandle
  className: string
  cursor: string
}> = [
  {
    id: "nw",
    className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    cursor: "nwse-resize",
  },
  {
    id: "n",
    className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    cursor: "ns-resize",
  },
  {
    id: "ne",
    className: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    cursor: "nesw-resize",
  },
  {
    id: "e",
    className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    cursor: "ew-resize",
  },
  {
    id: "se",
    className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
    cursor: "nwse-resize",
  },
  {
    id: "s",
    className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    cursor: "ns-resize",
  },
  {
    id: "sw",
    className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    cursor: "nesw-resize",
  },
  {
    id: "w",
    className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    cursor: "ew-resize",
  },
]

export function ImageLayerBox({
  layer,
  displayScale,
  trimWidthPx,
  trimHeightPx,
  snapGuideXs,
  snapGuideYs,
  snapThresholdTrimPx = SNAP_THRESHOLD_TRIM_PX,
  onActiveSnapGuidesChange,
  isSelected,
  zIndex,
  getFrameElement,
  onUpdate,
  onSelect,
}: ImageLayerBoxProps) {
  const dragSessionRef = useRef<DragSession | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = layer.width * displayScale
  const height = layer.height * displayScale
  const fill = resolveImageLayerFill(layer)
  const opacity = resolveImageLayerOpacity(layer)
  const hasImage = imageLayerHasImage(layer)

  function applySnap(
    x: number,
    y: number,
    w: number,
    h: number
  ): { x: number; y: number; w: number; h: number } {
    if (
      !snapGuideXs ||
      !snapGuideYs ||
      snapGuideXs.length === 0 ||
      snapGuideYs.length === 0
    ) {
      onActiveSnapGuidesChange?.(null)
      return { x, y, w, h }
    }

    const snapped = snapLayerBoxTrimPx(
      x,
      y,
      w,
      h,
      snapGuideXs,
      snapGuideYs,
      snapThresholdTrimPx,
      trimWidthPx,
      trimHeightPx
    )

    onActiveSnapGuidesChange?.(
      snapped.activeGuideXs.length > 0 || snapped.activeGuideYs.length > 0
        ? {
            xs: snapped.activeGuideXs,
            ys: snapped.activeGuideYs,
          }
        : null
    )

    return {
      x: snapped.x,
      y: snapped.y,
      w: snapped.w,
      h: snapped.h,
    }
  }

  function endDrag() {
    dragSessionRef.current = null
    setIsDragging(false)
    onActiveSnapGuidesChange?.(null)
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", onPointerUp)
    window.removeEventListener("pointercancel", onPointerUp)
  }

  function onPointerMove(ev: PointerEvent) {
    const session = dragSessionRef.current
    if (!session || ev.pointerId !== session.pointerId) {
      return
    }

    const pt = clientToTrim(
      getFrameElement(),
      ev.clientX,
      ev.clientY,
      displayScale
    )

    if (session.kind === "move") {
      const dx = pt.x - session.trimStartX
      const dy = pt.y - session.trimStartY
      let x = clamp(
        session.startX + dx,
        0,
        Math.max(0, trimWidthPx - session.startW)
      )
      let y = clamp(
        session.startY + dy,
        0,
        Math.max(0, trimHeightPx - session.startH)
      )
      const snapped = applySnap(x, y, session.startW, session.startH)
      onUpdate({ x: snapped.x, y: snapped.y })
      return
    }

    const next =
      session.handle === "n" ||
      session.handle === "s" ||
      session.handle === "e" ||
      session.handle === "w"
        ? applyEdgeResize(
            session.handle,
            pt.x,
            pt.y,
            {
              x: session.startX,
              y: session.startY,
              w: session.startW,
              h: session.startH,
            },
            trimWidthPx,
            trimHeightPx
          )
        : applyCornerResize(
            session.handle,
            pt.x,
            pt.y,
            {
              x: session.startX,
              y: session.startY,
              w: session.startW,
              h: session.startH,
            },
            trimWidthPx,
            trimHeightPx
          )

    const snapped = applySnap(next.x, next.y, next.w, next.h)
    onUpdate({
      x: snapped.x,
      y: snapped.y,
      width: snapped.w,
      height: snapped.h,
    })
  }

  function onPointerUp(ev: PointerEvent) {
    const session = dragSessionRef.current
    if (!session || ev.pointerId !== session.pointerId) {
      return
    }
    endDrag()
  }

  function startMove(event: React.PointerEvent) {
    if (!isSelected || event.button !== 0) {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    const pt = clientToTrim(
      getFrameElement(),
      event.clientX,
      event.clientY,
      displayScale
    )

    dragSessionRef.current = {
      kind: "move",
      pointerId: event.pointerId,
      trimStartX: pt.x,
      trimStartY: pt.y,
      startX: layer.x,
      startY: layer.y,
      startW: layer.width,
      startH: layer.height,
    }
    setIsDragging(true)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  function startResize(handle: ResizeHandle, event: React.PointerEvent) {
    event.stopPropagation()
    event.preventDefault()

    dragSessionRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      handle,
      startX: layer.x,
      startY: layer.y,
      startW: layer.width,
      startH: layer.height,
    }
    setIsDragging(true)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  return (
    <div
      data-designer-image-box
      className={cn(
        "pointer-events-auto absolute touch-none overflow-hidden",
        isSelected && !isDragging && "cursor-move"
      )}
      style={{ left, top, width, height, zIndex, opacity }}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect()
        if (isSelected) {
          startMove(event)
        }
      }}
    >
      <div
        className={cn(
          "h-full w-full",
          !hasImage && "border border-dashed border-muted-foreground/40"
        )}
        style={hasImage ? backgroundSettingsToStyle(fill) : undefined}
      />

      {isSelected ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-[#7c3aed]"
          />
          {HANDLES.map(({ id, className, cursor }) => (
            <button
              key={id}
              type="button"
              aria-label={`Resize ${layer.name}`}
              className={cn(
                "absolute z-10 size-2 rounded-sm border border-[#7c3aed] bg-white",
                className
              )}
              style={{ cursor, margin: `calc(-1 * (${HANDLE_STICK_OUT}))` }}
              onPointerDown={(event) => startResize(id, event)}
            />
          ))}
        </>
      ) : null}
    </div>
  )
}
