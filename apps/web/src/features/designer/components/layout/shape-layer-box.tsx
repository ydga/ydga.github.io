import { useRef, useState } from "react"

import type {
  ShapeLayer,
  ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsToStyle } from "@/features/designer/lib/background-style"
import {
  isShapeFillTransparent,
  resolveShapeLayerFillBackground,
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeWidth,
} from "@/features/designer/model/shape-layer-style"
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

type ShapeLayerBoxProps = {
  layer: ShapeLayer
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
  onUpdate: (patch: ShapeLayerUpdatePatch) => void
  onSelect: () => void
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
  start: { x: number; y: number; w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  const { x: sx, y: sy, w: sw, h: sh } = start
  const right = sx + sw
  const bottom = sy + sh

  switch (handle) {
    case "e": {
      const w = Math.max(MIN_W_TRIM, px - sx)
      return { x: sx, y: sy, w, h: sh }
    }
    case "w": {
      const newLeft = Math.min(px, right - MIN_W_TRIM)
      const w = right - newLeft
      return { x: newLeft, y: sy, w, h: sh }
    }
    case "s": {
      const h = Math.max(MIN_H_TRIM, py - sy)
      return { x: sx, y: sy, w: sw, h }
    }
    case "n": {
      const newTop = Math.min(py, bottom - MIN_H_TRIM)
      const h = bottom - newTop
      return { x: sx, y: newTop, w: sw, h }
    }
  }
}

function applyCornerResize(
  handle: "nw" | "ne" | "sw" | "se",
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  const { x: sx, y: sy, w: sw, h: sh } = start
  const right = sx + sw
  const bottom = sy + sh
  if (sw <= 0 || sh <= 0 || !Number.isFinite(sw) || !Number.isFinite(sh)) {
    return {
      x: sx,
      y: sy,
      w: Math.max(MIN_W_TRIM, sw),
      h: Math.max(MIN_H_TRIM, sh),
    }
  }

  const kMin = Math.max(MIN_W_TRIM / sw, MIN_H_TRIM / sh)
  let rawW: number
  let rawH: number

  switch (handle) {
    case "se": {
      rawW = px - sx
      rawH = py - sy
      break
    }
    case "nw": {
      rawW = right - px
      rawH = bottom - py
      break
    }
    case "ne": {
      rawW = px - sx
      rawH = bottom - py
      break
    }
    case "sw": {
      rawW = right - px
      rawH = py - sy
      break
    }
  }

  let k = Math.min(rawW / sw, rawH / sh)
  if (!Number.isFinite(k)) {
    k = kMin
  }
  k = Math.max(kMin, k)

  const w = k * sw
  const h = k * sh

  switch (handle) {
    case "se":
      return { x: sx, y: sy, w, h }
    case "nw":
      return { x: right - w, y: bottom - h, w, h }
    case "ne":
      return { x: sx, y: bottom - h, w, h }
    case "sw":
      return { x: right - w, y: sy, w, h }
  }
}

function applyResize(
  handle: ResizeHandle,
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  if (handle === "n" || handle === "s" || handle === "e" || handle === "w") {
    return applyEdgeResize(handle, px, py, start)
  }
  return applyCornerResize(handle, px, py, start)
}

function ShapeFillBackground({
  layer,
  width,
  height,
  opacity,
}: {
  layer: ShapeLayer
  width: number
  height: number
  opacity: number
}) {
  if (isShapeFillTransparent(layer)) {
    return null
  }

  const fill = resolveShapeLayerFillBackground(layer)
  const clipId = `shape-fill-clip-${layer.id}`

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          {layer.shapeType === "square" ? (
            <rect x={0} y={0} width={width} height={height} />
          ) : null}
          {layer.shapeType === "circle" ? (
            <ellipse
              cx={width / 2}
              cy={height / 2}
              rx={width / 2}
              ry={height / 2}
            />
          ) : null}
          {layer.shapeType === "triangle" ? (
            <polygon points={`${width / 2},0 ${width},${height} 0,${height}`} />
          ) : null}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} opacity={opacity}>
        <foreignObject x={0} y={0} width={width} height={height}>
          <div
            style={{
              width: "100%",
              height: "100%",
              ...backgroundSettingsToStyle(fill),
            }}
          />
        </foreignObject>
      </g>
    </>
  )
}

function ShapePreview({
  layer,
  width,
  height,
}: {
  layer: ShapeLayer
  width: number
  height: number
}) {
  const stroke = resolveShapeLayerStroke(layer)
  const strokeWidth = resolveShapeLayerStrokeWidth(layer)
  const opacity = resolveShapeLayerOpacity(layer)

  const sw = strokeWidth

  switch (layer.shapeType) {
    case "square":
      return (
        <>
          <ShapeFillBackground
            layer={layer}
            width={width}
            height={height}
            opacity={opacity}
          />
          <rect
            x={sw / 2}
            y={sw / 2}
            width={Math.max(0, width - sw)}
            height={Math.max(0, height - sw)}
            fill="none"
            stroke={stroke !== "transparent" && sw > 0 ? stroke : undefined}
            strokeWidth={stroke !== "transparent" && sw > 0 ? sw : 0}
          />
        </>
      )
    case "circle":
      return (
        <>
          <ShapeFillBackground
            layer={layer}
            width={width}
            height={height}
            opacity={opacity}
          />
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={Math.max(0, width / 2 - sw / 2)}
            ry={Math.max(0, height / 2 - sw / 2)}
            fill="none"
            stroke={stroke !== "transparent" && sw > 0 ? stroke : undefined}
            strokeWidth={stroke !== "transparent" && sw > 0 ? sw : 0}
          />
        </>
      )
    case "triangle":
      return (
        <>
          <ShapeFillBackground
            layer={layer}
            width={width}
            height={height}
            opacity={opacity}
          />
          <polygon
            points={`${width / 2},${sw / 2} ${width - sw / 2},${height - sw / 2} ${sw / 2},${height - sw / 2}`}
            fill="none"
            stroke={stroke !== "transparent" && sw > 0 ? stroke : undefined}
            strokeWidth={stroke !== "transparent" && sw > 0 ? sw : 0}
            strokeLinejoin="round"
          />
        </>
      )
    case "line":
      return (
        <line
          x1={0}
          y1={0}
          x2={width}
          y2={height}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity={opacity}
        />
      )
  }
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

export function ShapeLayerBox({
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
}: ShapeLayerBoxProps) {
  const dragSessionRef = useRef<DragSession | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = layer.width * displayScale
  const height = layer.height * displayScale

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
      trimHeightPx,
      { boundToTrim: false }
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
      const x = session.startX + dx
      const y = session.startY + dy
      const snapped = applySnap(x, y, session.startW, session.startH)
      onUpdate({ x: snapped.x, y: snapped.y })
      return
    }

    const next = applyResize(
      session.handle,
      pt.x,
      pt.y,
      {
        x: session.startX,
        y: session.startY,
        w: session.startW,
        h: session.startH,
      }
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
      data-designer-shape-box
      className={cn(
        "pointer-events-auto absolute touch-none",
        isSelected && !isDragging && "cursor-move"
      )}
      style={{ left, top, width, height, zIndex }}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect()
        if (isSelected) {
          startMove(event)
        }
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <ShapePreview layer={layer} width={width} height={height} />
      </svg>

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
