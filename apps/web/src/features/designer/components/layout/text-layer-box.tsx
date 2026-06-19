import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import type {
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { measureTextLayerContentBox } from "@/features/designer/lib/text-layer-layout"
import {
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerSizing,
} from "@/features/designer/model/text-layer-style"
import { cn } from "@workspace/ui/lib/utils"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36
/** Square text boxes use one side length; respect the larger canvas minimum. */
const MIN_SIDE_TRIM = Math.max(MIN_W_TRIM, MIN_H_TRIM)

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

type TextLayerBoxProps = {
  layer: TextLayer
  displayScale: number
  trimWidthPx: number
  trimHeightPx: number
  isSelected: boolean
  zIndex: number
  getFrameElement: () => HTMLElement | null
  onUpdate: (patch: TextLayerUpdatePatch) => void
  onSelect: () => void
  onRegisterTextarea: (
    layerId: string,
    node: HTMLTextAreaElement | null
  ) => void
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

/** Resize while keeping width === height (trim-space px). */
function applySquareResize(
  handle: ResizeHandle,
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
    case "se": {
      const maxS = Math.min(trimW - sx, trimH - sy)
      const s = clamp(Math.min(px - sx, py - sy), MIN_SIDE_TRIM, maxS)
      return { x: sx, y: sy, w: s, h: s }
    }
    case "nw": {
      const maxS = Math.min(right, bottom)
      const s = clamp(Math.min(right - px, bottom - py), MIN_SIDE_TRIM, maxS)
      return { x: right - s, y: bottom - s, w: s, h: s }
    }
    case "ne": {
      const maxS = Math.min(trimW - sx, bottom)
      const s = clamp(Math.min(px - sx, bottom - py), MIN_SIDE_TRIM, maxS)
      return { x: sx, y: bottom - s, w: s, h: s }
    }
    case "sw": {
      const maxS = Math.min(right, trimH - sy)
      const s = clamp(Math.min(right - px, py - sy), MIN_SIDE_TRIM, maxS)
      return { x: right - s, y: sy, w: s, h: s }
    }
    case "e": {
      const maxS = Math.min(trimW - sx, trimH)
      const s = clamp(px - sx, MIN_SIDE_TRIM, maxS)
      let y = sy + (sh - s) / 2
      y = clamp(y, 0, trimH - s)
      return { x: sx, y, w: s, h: s }
    }
    case "w": {
      const maxS = Math.min(right, trimH)
      const s = clamp(right - px, MIN_SIDE_TRIM, maxS)
      let y = sy + (sh - s) / 2
      y = clamp(y, 0, trimH - s)
      return { x: right - s, y, w: s, h: s }
    }
    case "s": {
      const maxS = Math.min(trimH - sy, trimW)
      const s = clamp(py - sy, MIN_SIDE_TRIM, maxS)
      let x = sx + (sw - s) / 2
      x = clamp(x, 0, trimW - s)
      return { x, y: sy, w: s, h: s }
    }
    case "n": {
      const maxS = Math.min(bottom, trimW)
      const s = clamp(bottom - py, MIN_SIDE_TRIM, maxS)
      let x = sx + (sw - s) / 2
      x = clamp(x, 0, trimW - s)
      return { x, y: bottom - s, w: s, h: s }
    }
  }
}

export function TextLayerBox({
  layer,
  displayScale,
  trimWidthPx,
  trimHeightPx,
  isSelected,
  zIndex,
  getFrameElement,
  onUpdate,
  onSelect,
  onRegisterTextarea,
}: TextLayerBoxProps) {
  const dragRef = useRef<DragSession | null>(null)
  const pointerCaptureRef = useRef<HTMLElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [textEditing, setTextEditing] = useState(false)

  const boxHeightTrim = layer.height
  const sizing = resolveTextLayerSizing(layer)
  const chromeActive = isSelected && !textEditing

  useEffect(() => {
    if (!isSelected) {
      setTextEditing(false)
    }
  }, [isSelected])

  useLayoutEffect(() => {
    if (sizing !== "hug") {
      return
    }

    const maxWrap = Math.max(MIN_W_TRIM, trimWidthPx - layer.x)
    const maxH = Math.max(MIN_H_TRIM, trimHeightPx - layer.y)
    const measured = measureTextLayerContentBox(layer, maxWrap)
    const width = Math.min(measured.width, maxWrap)
    const height = Math.min(measured.height, maxH)

    if (
      Math.abs(width - layer.width) > 0.5 ||
      Math.abs(height - layer.height) > 0.5
    ) {
      onUpdate({ width, height })
    }
  }, [
    layer.color,
    layer.fontFamily,
    layer.fontSizePx,
    layer.height,
    layer.text,
    layer.textSizing,
    layer.width,
    layer.x,
    layer.y,
    onUpdate,
    sizing,
    trimHeightPx,
    trimWidthPx,
  ])

  const endDrag = useCallback((event: PointerEvent) => {
    const cap = pointerCaptureRef.current
    if (cap?.hasPointerCapture?.(event.pointerId)) {
      cap.releasePointerCapture(event.pointerId)
    }
    pointerCaptureRef.current = null
    dragRef.current = null
  }, [])

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const session = dragRef.current
      if (!session || event.pointerId !== session.pointerId) {
        return
      }

      const { x: px, y: py } = clientToTrim(
        getFrameElement(),
        event.clientX,
        event.clientY,
        displayScale
      )

      if (session.kind === "move") {
        const dx = px - session.trimStartX
        const dy = py - session.trimStartY
        onUpdate({
          x: clamp(
            session.startX + dx,
            0,
            Math.max(0, trimWidthPx - session.startW)
          ),
          y: clamp(
            session.startY + dy,
            0,
            Math.max(0, trimHeightPx - session.startH)
          ),
        })
        return
      }

      const next = applySquareResize(
        session.handle,
        px,
        py,
        {
          x: session.startX,
          y: session.startY,
          w: session.startW,
          h: session.startH,
        },
        trimWidthPx,
        trimHeightPx
      )

      const nx = clamp(next.x, 0, trimWidthPx - next.w)
      const ny = clamp(next.y, 0, trimHeightPx - next.h)
      onUpdate({
        x: nx,
        y: ny,
        width: next.w,
        height: next.h,
      })
    }

    function onPointerUp(event: PointerEvent) {
      const session = dragRef.current
      if (session && event.pointerId === session.pointerId) {
        endDrag(event)
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [
    displayScale,
    endDrag,
    getFrameElement,
    onUpdate,
    trimHeightPx,
    trimWidthPx,
  ])

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()
    setTextEditing(false)
    onSelect()
    const trim = clientToTrim(
      getFrameElement(),
      event.clientX,
      event.clientY,
      displayScale
    )
    dragRef.current = {
      kind: "move",
      pointerId: event.pointerId,
      trimStartX: trim.x,
      trimStartY: trim.y,
      startX: layer.x,
      startY: layer.y,
      startW: layer.width,
      startH: boxHeightTrim,
    }
    const el = event.currentTarget as HTMLElement
    pointerCaptureRef.current = el
    el.setPointerCapture(event.pointerId)
  }

  function startResize(handle: ResizeHandle, event: React.PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()
    setTextEditing(false)
    onSelect()
    if (resolveTextLayerSizing(layer) === "hug") {
      onUpdate({ textSizing: "fixed" })
    }
    dragRef.current = {
      kind: "resize",
      pointerId: event.pointerId,
      handle,
      startX: layer.x,
      startY: layer.y,
      startW: layer.width,
      startH: boxHeightTrim,
    }
    const el = event.currentTarget as HTMLElement
    pointerCaptureRef.current = el
    el.setPointerCapture(event.pointerId)
  }

  const handleBase =
    "absolute z-20 box-border size-2.5 rounded-[2px] border-2 border-[#7c3aed] bg-white touch-none"

  const cursorFor: Record<ResizeHandle, string> = {
    nw: "cursor-nwse-resize",
    n: "cursor-ns-resize",
    ne: "cursor-nesw-resize",
    e: "cursor-ew-resize",
    se: "cursor-nwse-resize",
    s: "cursor-ns-resize",
    sw: "cursor-nesw-resize",
    w: "cursor-ew-resize",
  }

  const left = layer.x * displayScale
  const top = layer.y * displayScale
  const width = layer.width * displayScale
  const height = boxHeightTrim * displayScale
  const fontPx = resolveTextLayerFontSizePx(layer) * displayScale
  const fontFamily = resolveTextLayerFontFamily(layer)
  const color = resolveTextLayerColor(layer)

  return (
    <div
      data-designer-text-box
      data-designer-text-layer
      className={cn(
        "pointer-events-auto absolute box-border overflow-visible rounded-[2px] border-2 border-transparent",
        chromeActive
          ? "border-[#7c3aed] p-1.5"
          : "hover:border-muted-foreground/25"
      )}
      style={{
        left,
        top,
        width,
        height,
        zIndex,
      }}
      aria-label={
        isSelected && !textEditing ? "Text — double-click to edit" : undefined
      }
      onDoubleClick={(event) => {
        if (!isSelected) {
          return
        }
        const t = event.target as HTMLElement
        if (t.closest("[data-designer-text-handle]")) {
          return
        }
        setTextEditing(true)
        requestAnimationFrame(() => {
          textareaRef.current?.focus()
        })
      }}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("[data-designer-text-handle]")) {
          return
        }
        if (target.closest("[data-designer-text-drag]")) {
          return
        }
        if (target.closest("textarea")) {
          return
        }
        event.stopPropagation()
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("[data-designer-text-handle]")) {
          event.stopPropagation()
          return
        }
        if (target.closest("[data-designer-text-drag]")) {
          event.stopPropagation()
          return
        }
        if (target.closest("textarea")) {
          event.stopPropagation()
          return
        }
        event.stopPropagation()
        onSelect()
      }}
    >
      <textarea
        ref={(node) => {
          textareaRef.current = node
          onRegisterTextarea(layer.id, node)
        }}
        aria-label="Text on canvas"
        readOnly={!textEditing}
        data-designer-text-editing={textEditing ? "true" : undefined}
        tabIndex={textEditing ? 0 : -1}
        className={cn(
          "absolute inset-0 z-0 box-border h-full w-full resize-none border-0 bg-transparent p-0.5 outline-none focus-visible:ring-0",
          sizing === "hug"
            ? "overflow-hidden"
            : "overflow-x-hidden overflow-y-auto"
        )}
        style={{
          fontSize: fontPx,
          lineHeight: 1.35,
          fontFamily,
          color,
        }}
        value={layer.text}
        placeholder="Type…"
        onChange={(event) => onUpdate({ text: event.target.value })}
        onMouseDown={(event) => {
          if (event.detail === 2) {
            setTextEditing(true)
            return
          }
          if (!textEditing) {
            event.preventDefault()
          }
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
        onDoubleClick={() => {
          setTextEditing(true)
          requestAnimationFrame(() => {
            textareaRef.current?.focus()
          })
        }}
        onBlur={() => {
          setTextEditing(false)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            setTextEditing(false)
            event.currentTarget.blur()
          }
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (!isSelected) {
            onSelect()
          }
        }}
      />

      {isSelected ? (
        <>
          <div
            data-designer-text-drag
            aria-label="Drag to move text"
            className="pointer-events-auto absolute top-0 right-0 left-0 z-10 cursor-grab active:cursor-grabbing"
            style={{ height: Math.max(6, 6 * displayScale) }}
            onPointerDown={startMove}
            onClick={(event) => event.stopPropagation()}
          />
          <div
            data-designer-text-drag
            aria-label="Drag to move text"
            className="pointer-events-auto absolute right-0 bottom-0 left-0 z-10 cursor-grab active:cursor-grabbing"
            style={{ height: Math.max(6, 6 * displayScale) }}
            onPointerDown={startMove}
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north-west"
            className={cn(
              handleBase,
              cursorFor.nw,
              "top-0 left-0 -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("nw", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north"
            className={cn(
              handleBase,
              cursorFor.n,
              "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("n", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north-east"
            className={cn(
              handleBase,
              cursorFor.ne,
              "top-0 left-full -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("ne", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize east"
            className={cn(
              handleBase,
              cursorFor.e,
              "top-1/2 left-full -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("e", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south-east"
            className={cn(
              handleBase,
              cursorFor.se,
              "top-full left-full -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("se", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south"
            className={cn(
              handleBase,
              cursorFor.s,
              "top-full left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("s", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south-west"
            className={cn(
              handleBase,
              cursorFor.sw,
              "top-full left-0 -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("sw", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize west"
            className={cn(
              handleBase,
              cursorFor.w,
              "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"
            )}
            onPointerDown={(e) => startResize("w", e)}
          />
        </>
      ) : null}
    </div>
  )
}
