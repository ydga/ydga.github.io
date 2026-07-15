import { useRef, useState } from "react"

import type {
  ShapeLayer,
  ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { resolveLinePoints } from "@/features/designer/model/line-geometry"
import { backgroundSettingsToStyle } from "@/features/designer/lib/background-style"
import {
  isShapeFillTransparent,
  resolveShapeLayerFillBackground,
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeWidth,
} from "@/features/designer/model/shape-layer-style"
import { LineShapeLayerBox } from "@/features/designer/components/layout/line-shape-layer-box"
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
      /** Clone created once Shift+Option is held during this move. */
      duplicated: boolean
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
  isSelected: boolean
  zIndex: number
  getFrameElement: () => HTMLElement | null
  onUpdate: (patch: ShapeLayerUpdatePatch) => void
  onSelect: () => void
  /** Shift+Option while dragging: leave a clone at `at` (drag start). */
  onDuplicateInPlace: (at: { x: number; y: number }) => void
}

const DUPLICATE_MOVE_THRESHOLD_TRIM_PX = 2

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

  // Uniform scale from the opposite corner so aspect ratio stays locked.
  const kMin = Math.max(MIN_W_TRIM / sw, MIN_H_TRIM / sh)
  let rawW: number
  let rawH: number
  let kMax: number

  switch (handle) {
    case "se": {
      rawW = px - sx
      rawH = py - sy
      kMax = Math.min((trimW - sx) / sw, (trimH - sy) / sh)
      break
    }
    case "nw": {
      rawW = right - px
      rawH = bottom - py
      kMax = Math.min(right / sw, bottom / sh)
      break
    }
    case "ne": {
      rawW = px - sx
      rawH = bottom - py
      kMax = Math.min((trimW - sx) / sw, bottom / sh)
      break
    }
    case "sw": {
      rawW = right - px
      rawH = py - sy
      kMax = Math.min(right / sw, (trimH - sy) / sh)
      break
    }
  }

  let k = Math.min(rawW / sw, rawH / sh)
  if (!Number.isFinite(k)) {
    k = kMin
  }
  k = clamp(k, kMin, Math.max(kMin, kMax))

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
  start: { x: number; y: number; w: number; h: number },
  trimW: number,
  trimH: number
): { x: number; y: number; w: number; h: number } {
  if (handle === "n" || handle === "s" || handle === "e" || handle === "w") {
    return applyEdgeResize(handle, px, py, start, trimW, trimH)
  }
  return applyCornerResize(handle, px, py, start, trimW, trimH)
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
            stroke={stroke !== "transparent" ? stroke : undefined}
            strokeWidth={stroke !== "transparent" ? sw : 0}
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
            stroke={stroke !== "transparent" ? stroke : undefined}
            strokeWidth={stroke !== "transparent" ? sw : 0}
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
            stroke={stroke !== "transparent" ? stroke : undefined}
            strokeWidth={stroke !== "transparent" ? sw : 0}
            strokeLinejoin="round"
          />
        </>
      )
    case "line": {
      const pts = resolveLinePoints(layer)
      const svgPoints = pts.map((p) => `${p.x},${p.y}`).join(" ")
      return (
        <polyline
          points={svgPoints}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
      )
    }
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

export function ShapeLayerBox(props: ShapeLayerBoxProps) {
  if (props.layer.shapeType === "line") {
    return <LineShapeLayerBox {...props} />
  }
  return <ClosedShapeLayerBox {...props} />
}

function ClosedShapeLayerBox({
  layer,
  displayScale,
  trimWidthPx,
  trimHeightPx,
  isSelected,
  zIndex,
  getFrameElement,
  onUpdate,
  onSelect,
  onDuplicateInPlace,
}: ShapeLayerBoxProps) {
  const dragSessionRef = useRef<DragSession | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = layer.width * displayScale
  const height = layer.height * displayScale

  function endDrag() {
    dragSessionRef.current = null
    setIsDragging(false)
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

      // Shift+Option (Alt) held during the drag — leave a clone at the start.
      if (
        !session.duplicated &&
        ev.shiftKey &&
        ev.altKey &&
        dx * dx + dy * dy >=
          DUPLICATE_MOVE_THRESHOLD_TRIM_PX * DUPLICATE_MOVE_THRESHOLD_TRIM_PX
      ) {
        onDuplicateInPlace({ x: session.startX, y: session.startY })
        session.duplicated = true
      }

      const x = clamp(session.startX + dx, 0, trimWidthPx - session.startW)
      const y = clamp(session.startY + dy, 0, trimHeightPx - session.startH)
      onUpdate({ x, y })
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
      },
      trimWidthPx,
      trimHeightPx
    )
    onUpdate(next)
  }

  function onPointerUp(ev: PointerEvent) {
    const session = dragSessionRef.current
    if (!session || ev.pointerId !== session.pointerId) {
      return
    }
    endDrag()
  }

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0) {
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
      duplicated: false,
    }
    setIsDragging(true)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  function startResize(handle: ResizeHandle, event: React.PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()

    // Drop any move session so a bubbled body press cannot steal this resize.
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
        !isDragging && "cursor-move"
      )}
      style={{ left, top, width, height, zIndex }}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement
        // Resize handles manage their own gesture — do not start a move.
        if (target.closest("[data-designer-shape-handle]")) {
          return
        }
        event.stopPropagation()
        onSelect()
        // Start move on the same press that selects — `isSelected` is still
        // false in this render, so gating on it forced a second press to drag.
        startMove(event)
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
              data-designer-shape-handle
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
