import { useEffect, useRef, useState } from "react"

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
  isShapeFillTransparent,
  resolveShapeLayerFillBackground,
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeDasharray,
  resolveShapeLayerStrokeWidth,
} from "@/features/designer/model/shape-layer-style"
import { backgroundSettingsToStyle } from "@/features/designer/lib/background-style"
import { cn } from "@workspace/ui/lib/utils"

const DUPLICATE_MOVE_THRESHOLD_TRIM_PX = 2
const CLICK_MOVE_THRESHOLD_TRIM_PX = 3
const STROKE_HIT_MIN_SCREEN_PX = 14
const DEFAULT_NODE_FALLBACK = "#c4b5fd"
const NODE_NUDGE_PX = 1
const NODE_NUDGE_SHIFT_PX = 10
const SELECTED_NODE_BORDER = "#7c3aed"

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

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  if (target.isContentEditable) {
    return true
  }
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
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
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  )

  const relativePoints = resolveLinePoints(layer)
  const isPolygon = layer.shapeType === "polygon"
  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = Math.max(1, layer.width * displayScale)
  const height = Math.max(1, layer.height * displayScale)
  const stroke = resolveShapeLayerStroke(layer)
  const strokeWidth = resolveShapeLayerStrokeWidth(layer)
  const opacity = resolveShapeLayerOpacity(layer)
  const fill = resolveShapeLayerFillBackground(layer)
  const hasFill = isPolygon && !isShapeFillTransparent(layer)
  const dasharray = resolveShapeLayerStrokeDasharray(layer, displayScale)
  const hitStroke = Math.max(
    strokeWidth * displayScale,
    STROKE_HIT_MIN_SCREEN_PX
  )
  const strokeDasharray = dasharray ? dasharray.join(" ") : undefined
  const nodeColor =
    stroke !== "transparent"
      ? stroke
      : fill.type === "color"
        ? fill.color
        : DEFAULT_NODE_FALLBACK
  const clipId = `polygon-fill-clip-${layer.id}`
  const svgPoints = pointsToSvg(relativePoints, displayScale)

  useEffect(() => {
    if (!isSelected) {
      setSelectedPointIndex(null)
    }
  }, [isSelected])

  useEffect(() => {
    if (
      selectedPointIndex != null &&
      selectedPointIndex >= relativePoints.length
    ) {
      setSelectedPointIndex(null)
    }
  }, [relativePoints.length, selectedPointIndex])

  useEffect(() => {
    if (!isSelected || selectedPointIndex == null) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return
      }
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown"
      ) {
        if (event.key === "Escape") {
          event.preventDefault()
          setSelectedPointIndex(null)
        }
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const step = event.shiftKey ? NODE_NUDGE_SHIFT_PX : NODE_NUDGE_PX
      let dx = 0
      let dy = 0
      if (event.key === "ArrowLeft") dx = -step
      if (event.key === "ArrowRight") dx = step
      if (event.key === "ArrowUp") dy = -step
      if (event.key === "ArrowDown") dy = step

      const abs = toAbsoluteLinePoints(layer)
      const current = abs[selectedPointIndex!]
      if (!current) {
        return
      }
      abs[selectedPointIndex!] = clampPointToTrim(
        { x: current.x + dx, y: current.y + dy },
        trimWidthPx,
        trimHeightPx
      )
      onUpdate(syncLineLayerFromAbsolutePoints(layer, abs))
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
    }
  }, [
    isSelected,
    layer,
    onUpdate,
    selectedPointIndex,
    trimHeightPx,
    trimWidthPx,
  ])

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
      const inserted = insertPointOnPolyline(
        abs,
        session.clickAbsolute,
        0.08,
        isPolygon
      )
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
    setSelectedPointIndex(pointIndex)

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
    setSelectedPointIndex(null)

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
        {isPolygon ? (
          <>
            {hasFill ? (
              <>
                <defs>
                  <clipPath id={clipId}>
                    <polygon points={svgPoints} />
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
            ) : null}
            {/* Hit target covers the filled region */}
            <polygon
              points={svgPoints}
              fill="transparent"
              stroke="transparent"
              strokeWidth={hitStroke}
              strokeLinejoin="round"
              className={cn(
                "pointer-events-auto",
                !isDragging && "cursor-move"
              )}
              onPointerDown={startStrokePointer}
            />
            {stroke !== "transparent" ? (
              <polygon
                points={svgPoints}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth * displayScale}
                strokeLinejoin="round"
                strokeDasharray={strokeDasharray}
                opacity={opacity}
                className="pointer-events-none"
              />
            ) : null}
          </>
        ) : (
          <>
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
              strokeDasharray={strokeDasharray}
              opacity={opacity}
              className="pointer-events-none"
            />
          </>
        )}
      </svg>

      {isSelected
        ? relativePoints.map((point, index) => {
            const isNodeSelected = selectedPointIndex === index
            return (
              <button
                key={`${index}-${point.x}-${point.y}`}
                type="button"
                data-designer-line-node
                data-selected={isNodeSelected ? "true" : undefined}
                aria-label={
                  index === 0
                    ? isPolygon
                      ? "Polygon vertex 1"
                      : "Line start"
                    : index === relativePoints.length - 1
                      ? isPolygon
                        ? `Polygon vertex ${index + 1}`
                        : "Line end"
                      : isPolygon
                        ? `Polygon vertex ${index + 1}`
                        : `Line point ${index + 1}`
                }
                aria-pressed={isNodeSelected}
                className="pointer-events-auto absolute z-10 box-border size-2 rounded-[1px] border touch-none"
                style={{
                  left: point.x * displayScale,
                  top: point.y * displayScale,
                  transform: "translate(-50%, -50%)",
                  cursor: "move",
                  backgroundColor: isNodeSelected ? "#ffffff" : nodeColor,
                  borderColor: isNodeSelected
                    ? SELECTED_NODE_BORDER
                    : nodeColor,
                  opacity,
                }}
                onPointerDown={(event) => startPointDrag(index, event)}
              />
            )
          })
        : null}
    </div>
  )
}
