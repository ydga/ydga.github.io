import { useRef, useState } from "react"

import type {
  ShapeLayer,
  ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  clampPointToTrim,
  insertPointOnPolyline,
  resolveLinePoints,
  syncLineLayerFromAbsolutePoints,
  toAbsoluteLinePoints,
  type LinePoint,
} from "@/features/designer/model/line-geometry"
import {
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeWidth,
} from "@/features/designer/model/shape-layer-style"
import { cn } from "@workspace/ui/lib/utils"

const DUPLICATE_MOVE_THRESHOLD_TRIM_PX = 2
const CLICK_MOVE_THRESHOLD_TRIM_PX = 3
const NODE_HIT_SCREEN_PX = 10
const STROKE_HIT_MIN_SCREEN_PX = 14

type LineDragSession =
  | {
      kind: "move"
      pointerId: number
      trimStartX: number
      trimStartY: number
      startX: number
      startY: number
      startW: number
      startH: number
      duplicated: boolean
    }
  | {
      kind: "point"
      pointerId: number
      pointIndex: number
      /** Absolute points at drag start. */
      startAbsolute: LinePoint[]
    }
  | {
      kind: "stroke-pending"
      pointerId: number
      trimStartX: number
      trimStartY: number
      startX: number
      startY: number
      startW: number
      startH: number
      clickAbsolute: LinePoint
      duplicated: boolean
    }

type LineShapeLayerBoxProps = {
  layer: ShapeLayer
  displayScale: number
  trimWidthPx: number
  trimHeightPx: number
  isSelected: boolean
  zIndex: number
  getFrameElement: () => HTMLElement | null
  onUpdate: (patch: ShapeLayerUpdatePatch) => void
  onSelect: () => void
  onDuplicateInPlace: (at: { x: number; y: number }) => void
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

function pointsToSvg(points: LinePoint[], displayScale: number) {
  return points
    .map((p) => `${p.x * displayScale},${p.y * displayScale}`)
    .join(" ")
}

export function LineShapeLayerBox({
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
}: LineShapeLayerBoxProps) {
  const dragSessionRef = useRef<LineDragSession | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const relativePoints = resolveLinePoints(layer)
  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = Math.max(1, layer.width * displayScale)
  const height = Math.max(1, layer.height * displayScale)
  const stroke = resolveShapeLayerStroke(layer)
  const strokeWidth = resolveShapeLayerStrokeWidth(layer)
  const opacity = resolveShapeLayerOpacity(layer)
  const hitStroke = Math.max(
    strokeWidth * displayScale,
    STROKE_HIT_MIN_SCREEN_PX
  )
  const nodeSize = NODE_HIT_SCREEN_PX

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

    if (session.kind === "point") {
      const nextAbs = session.startAbsolute.map((p) => ({ ...p }))
      nextAbs[session.pointIndex] = clampPointToTrim(
        pt,
        trimWidthPx,
        trimHeightPx
      )
      onUpdate(syncLineLayerFromAbsolutePoints(layer, nextAbs))
      return
    }

    if (session.kind === "stroke-pending") {
      const dx = pt.x - session.trimStartX
      const dy = pt.y - session.trimStartY
      if (
        dx * dx + dy * dy <
        CLICK_MOVE_THRESHOLD_TRIM_PX * CLICK_MOVE_THRESHOLD_TRIM_PX
      ) {
        return
      }
      // Past threshold: promote to whole-line move.
      dragSessionRef.current = {
        kind: "move",
        pointerId: session.pointerId,
        trimStartX: session.trimStartX,
        trimStartY: session.trimStartY,
        startX: session.startX,
        startY: session.startY,
        startW: session.startW,
        startH: session.startH,
        duplicated: session.duplicated,
      }
      setIsDragging(true)
      // Fall through by re-entering as move on next event; apply now too.
      const x = clamp(session.startX + dx, 0, trimWidthPx - session.startW)
      const y = clamp(session.startY + dy, 0, trimHeightPx - session.startH)
      onUpdate({ x, y })
      return
    }

    if (session.kind === "move") {
      const dx = pt.x - session.trimStartX
      const dy = pt.y - session.trimStartY

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
    }
  }

  function onPointerUp(ev: PointerEvent) {
    const session = dragSessionRef.current
    if (!session || ev.pointerId !== session.pointerId) {
      return
    }

    if (session.kind === "stroke-pending") {
      // Click without drag: insert a midpoint on the nearest segment.
      const abs = toAbsoluteLinePoints(layer)
      const inserted = insertPointOnPolyline(abs, session.clickAbsolute)
      if (inserted) {
        onUpdate(syncLineLayerFromAbsolutePoints(layer, inserted))
      }
    }

    endDrag()
  }

  function startPointDrag(pointIndex: number, event: React.PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()
    onSelect()

    dragSessionRef.current = {
      kind: "point",
      pointerId: event.pointerId,
      pointIndex,
      startAbsolute: toAbsoluteLinePoints(layer),
    }
    setIsDragging(true)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  function startStrokePointer(event: React.PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()
    onSelect()

    const pt = clientToTrim(
      getFrameElement(),
      event.clientX,
      event.clientY,
      displayScale
    )

    if (!isSelected) {
      // First press selects + may move; don't insert points until selected.
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
    } else {
      dragSessionRef.current = {
        kind: "stroke-pending",
        pointerId: event.pointerId,
        trimStartX: pt.x,
        trimStartY: pt.y,
        startX: layer.x,
        startY: layer.y,
        startW: layer.width,
        startH: layer.height,
        clickAbsolute: pt,
        duplicated: false,
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }

  const svgPoints = pointsToSvg(relativePoints, displayScale)

  return (
    <div
      data-designer-shape-box
      data-designer-line-box
      className="pointer-events-none absolute overflow-visible"
      style={{ left, top, width, height, zIndex }}
    >
      <svg
        className="absolute overflow-visible"
        width={width}
        height={height}
        aria-hidden
      >
        {/* Wide invisible stroke for hit testing */}
        <polyline
          points={svgPoints}
          fill="none"
          stroke="transparent"
          strokeWidth={hitStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "pointer-events-auto",
            !isDragging && "cursor-move"
          )}
          onPointerDown={startStrokePointer}
        />
        <polyline
          points={svgPoints}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth * displayScale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
          className="pointer-events-none"
        />
      </svg>

      {isSelected
        ? relativePoints.map((point, index) => (
            <button
              key={`${index}-${point.x}-${point.y}`}
              type="button"
              data-designer-line-node
              aria-label={
                index === 0
                  ? "Line start"
                  : index === relativePoints.length - 1
                    ? "Line end"
                    : `Line point ${index + 1}`
              }
              className="pointer-events-auto absolute z-10 rounded-sm border border-[#7c3aed] bg-white"
              style={{
                width: nodeSize,
                height: nodeSize,
                left: point.x * displayScale,
                top: point.y * displayScale,
                transform: "translate(-50%, -50%)",
                cursor: "move",
              }}
              onPointerDown={(event) => startPointDrag(index, event)}
            />
          ))
        : null}
    </div>
  )
}
