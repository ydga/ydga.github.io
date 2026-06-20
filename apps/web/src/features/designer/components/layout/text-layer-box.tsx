import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { flushSync } from "react-dom"

import type {
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  SNAP_THRESHOLD_TRIM_PX,
  snapTextLayerBoxTrimPx,
} from "@/features/designer/lib/guide-snap"
import {
  measureTextLayerContentBox,
  textLayerTextBlockHeightTrimPx,
  textLineHeightTrimPx,
  verticalTextOffsetTrimPx,
} from "@/features/designer/lib/text-layer-layout"
import {
  resolveTextLayerClip,
  resolveTextLayerColor,
  resolveTextLayerCanvasFont,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerFontWeight,
  resolveTextLayerLetterSpacingCss,
  resolveTextLayerLineHeightUnit,
  resolveTextLayerMaintainBoundsAspect,
  resolveTextLayerOpacity,
  resolveTextLayerSizing,
  resolveTextLayerTextTransform,
  resolveTextLayerTextAlign,
  resolveTextLayerTextDecorationLine,
  resolveTextLayerVerticalAlign,
} from "@/features/designer/model/text-layer-style"
import { cn } from "@workspace/ui/lib/utils"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36

/**
 * Resize handles use `size-2` (0.5rem). Shift by s/6 so ~1/3 of the handle
 * overlaps the text bounds and ~2/3 sits outside along each outward axis.
 * Keep in sync with {@link handleBase}.
 */
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

type TextLayerBoxProps = {
  layer: TextLayer
  displayScale: number
  trimWidthPx: number
  trimHeightPx: number
  /** When set, box position snaps to these trim-space X guides while moving or resizing. */
  snapGuideXs?: readonly number[] | null
  /** When set, box position snaps to these trim-space Y guides while moving or resizing. */
  snapGuideYs?: readonly number[] | null
  snapThresholdTrimPx?: number
  isSelected: boolean
  zIndex: number
  getFrameElement: () => HTMLElement | null
  onUpdate: (patch: TextLayerUpdatePatch) => void
  onSelect: () => void
  onRegisterTextarea: (
    layerId: string,
    node: HTMLTextAreaElement | null
  ) => void
  textLayerIdToBeginTyping: string | null
  onTextLayerBeginTypingHandled: () => void
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

/** Edge handles: change only width or height; opposite edge stays fixed. */
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

/**
 * Corner handles: uniform scale so width/height ratio matches the start rect
 * (trim-space px).
 */
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

/**
 * When bounds aspect is locked, edge handles reuse {@link applyCornerResize} so
 * sizing, trim clamps, and `k = min(rawW/sw, rawH/sh)` match corners. The moving
 * edge’s primary axis (width for e/w, height for n/s) drives the gesture; the
 * other coordinate is filled in along the start rect’s diagonal so mid-edge
 * drags do not skew scale the way a raw corner mapping would.
 */
function applyEdgeResizeUniformScale(
  handle: "n" | "s" | "e" | "w",
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number },
  trimW: number,
  trimH: number
): { x: number; y: number; w: number; h: number } {
  const { x: sx, y: sy, w: sw, h: sh } = start
  if (sw <= 0 || sh <= 0 || !Number.isFinite(sw) || !Number.isFinite(sh)) {
    return {
      x: sx,
      y: sy,
      w: Math.max(MIN_W_TRIM, sw),
      h: Math.max(MIN_H_TRIM, sh),
    }
  }

  const right = sx + sw
  const bottom = sy + sh

  switch (handle) {
    case "e": {
      const cy = sy + ((px - sx) * sh) / sw
      return applyCornerResize("se", px, cy, start, trimW, trimH)
    }
    case "s": {
      const cx = sx + ((py - sy) * sw) / sh
      return applyCornerResize("se", cx, py, start, trimW, trimH)
    }
    case "w": {
      const cy = bottom - ((right - px) * sh) / sw
      return applyCornerResize("nw", px, cy, start, trimW, trimH)
    }
    case "n": {
      const cx = sx + ((bottom - py) * sw) / sh
      return applyCornerResize("ne", cx, py, start, trimW, trimH)
    }
  }
}

function applyResizeWithAspectLock(
  handle: ResizeHandle,
  px: number,
  py: number,
  start: { x: number; y: number; w: number; h: number },
  trimW: number,
  trimH: number,
  uniformScale: boolean
): { x: number; y: number; w: number; h: number } {
  if (!uniformScale) {
    return applyResize(handle, px, py, start, trimW, trimH)
  }
  if (handle === "n" || handle === "s" || handle === "e" || handle === "w") {
    return applyEdgeResizeUniformScale(handle, px, py, start, trimW, trimH)
  }
  return applyCornerResize(handle, px, py, start, trimW, trimH)
}

export function TextLayerBox({
  layer,
  displayScale,
  trimWidthPx,
  trimHeightPx,
  snapGuideXs,
  snapGuideYs,
  snapThresholdTrimPx = SNAP_THRESHOLD_TRIM_PX,
  isSelected,
  zIndex,
  getFrameElement,
  onUpdate,
  onSelect,
  onRegisterTextarea,
  textLayerIdToBeginTyping,
  onTextLayerBeginTypingHandled,
}: TextLayerBoxProps) {
  const dragRef = useRef<DragSession | null>(null)
  const pointerCaptureRef = useRef<HTMLElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [textEditing, setTextEditing] = useState(false)

  const boxHeightTrim = layer.height
  const sizing = resolveTextLayerSizing(layer)
  const uniformResizeRef = useRef(false)
  const uniformScale =
    resolveTextLayerMaintainBoundsAspect(layer) && sizing === "fixed"
  useLayoutEffect(() => {
    uniformResizeRef.current = uniformScale
  })
  const chromeActive = isSelected
  const clipToBounds = resolveTextLayerClip(layer)

  const softWrapForDisplay = sizing === "fixed" || sizing === "auto-height"
  const dragStripScreenPx = Math.max(10, 10 * displayScale)

  const textVerticalOffsetTrim = useMemo(() => {
    if (typeof document === "undefined") {
      return 0
    }
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return 0
    }
    const maxW = Math.max(32, layer.width)
    ctx.font = resolveTextLayerCanvasFont(layer)
    const blockH = textLayerTextBlockHeightTrimPx(
      ctx,
      layer,
      maxW,
      softWrapForDisplay
    )
    const boxH = Math.max(MIN_H_TRIM, boxHeightTrim)
    /** Full box height: drag strips overlay the textarea without shrinking it (avoids text jump on select). */
    const contentBoxTrimH = boxH
    return verticalTextOffsetTrimPx(
      contentBoxTrimH,
      blockH,
      resolveTextLayerVerticalAlign(layer)
    )
  }, [
    boxHeightTrim,
    layer.fontFamily,
    layer.fontSizePx,
    layer.fontWeight,
    layer.height,
    layer.lineHeight,
    layer.lineHeightUnit,
    layer.text,
    layer.textUnderline,
    layer.textStrikethrough,
    layer.verticalAlign,
    layer.clip,
    layer.width,
    softWrapForDisplay,
  ])

  useEffect(() => {
    if (!isSelected) {
      queueMicrotask(() => {
        setTextEditing(false)
      })
    }
  }, [isSelected])

  /** UA styles make textareas scroll; block wheel on the field so the canvas zoom handler owns scroll gestures. */
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) {
      return
    }
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      event.stopPropagation()
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
    }
  }, [layer.id, clipToBounds, isSelected, textEditing])

  useLayoutEffect(() => {
    if (textLayerIdToBeginTyping !== layer.id) {
      return
    }
    queueMicrotask(() => {
      setTextEditing(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const node = textareaRef.current
          if (node) {
            node.focus({ preventScroll: true })
            node.select()
          }
          onTextLayerBeginTypingHandled()
        })
      })
    })
  }, [layer.id, onTextLayerBeginTypingHandled, textLayerIdToBeginTyping])

  useLayoutEffect(() => {
    if (sizing === "fixed") {
      return
    }

    const maxH = Math.max(MIN_H_TRIM, trimHeightPx - layer.y)

    if (sizing === "auto-width") {
      const measured = measureTextLayerContentBox(
        layer,
        Number.POSITIVE_INFINITY,
        false
      )
      const width = measured.width
      const height = measured.height
      if (
        Math.abs(width - layer.width) > 0.5 ||
        Math.abs(height - layer.height) > 0.5
      ) {
        onUpdate({ width, height })
      }
      return
    }

    const measured = measureTextLayerContentBox(layer, layer.width, true)
    const height = Math.min(measured.height, maxH)
    if (Math.abs(height - layer.height) > 0.5) {
      onUpdate({ height })
    }
  }, [
    layer.color,
    layer.fontFamily,
    layer.fontSizePx,
    layer.fontWeight,
    layer.height,
    layer.lineHeight,
    layer.lineHeightUnit,
    layer.text,
    layer.textAlign,
    layer.textSizing,
    layer.textStrikethrough,
    layer.textUnderline,
    layer.verticalAlign,
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
        if (
          snapGuideXs &&
          snapGuideYs &&
          snapGuideXs.length > 0 &&
          snapGuideYs.length > 0
        ) {
          const snapped = snapTextLayerBoxTrimPx(
            x,
            y,
            session.startW,
            session.startH,
            snapGuideXs,
            snapGuideYs,
            snapThresholdTrimPx,
            trimWidthPx,
            trimHeightPx
          )
          x = snapped.x
          y = snapped.y
        }
        onUpdate({ x, y })
        return
      }

      const next = applyResizeWithAspectLock(
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
        trimHeightPx,
        uniformResizeRef.current
      )

      let nx = clamp(next.x, 0, trimWidthPx - next.w)
      let ny = clamp(next.y, 0, trimHeightPx - next.h)
      if (
        snapGuideXs &&
        snapGuideYs &&
        snapGuideXs.length > 0 &&
        snapGuideYs.length > 0
      ) {
        const snapped = snapTextLayerBoxTrimPx(
          nx,
          ny,
          next.w,
          next.h,
          snapGuideXs,
          snapGuideYs,
          snapThresholdTrimPx,
          trimWidthPx,
          trimHeightPx
        )
        nx = snapped.x
        ny = snapped.y
      }
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
    snapGuideXs,
    snapGuideYs,
    snapThresholdTrimPx,
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
    if (resolveTextLayerSizing(layer) !== "fixed") {
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
    "absolute z-30 box-border size-2 rounded-[1px] border border-[#7c3aed] bg-white touch-none"

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
  const fontWeight = resolveTextLayerFontWeight(layer)
  const color = resolveTextLayerColor(layer)
  /** Grab strips sit in the top/bottom band only while the layer is selected. */
  const dragStripCssPx = dragStripScreenPx

  return (
    <div
      data-designer-text-box
      data-designer-text-layer
      className={cn(
        "pointer-events-auto absolute box-border overscroll-none border border-transparent",
        // Rounded corners + overflow can clip overflow-visible descendants in some engines when clip is off.
        clipToBounds ? "rounded-[2px]" : "rounded-none",
        // Resize handles extend past the box; unclipped text must paint past the layer rect too.
        isSelected || !clipToBounds ? "overflow-visible" : "overflow-hidden",
        chromeActive ? "border-[#7c3aed]" : "hover:border-muted-foreground/25"
      )}
      style={{
        left,
        top,
        width,
        height,
        zIndex,
        opacity: resolveTextLayerOpacity(layer),
      }}
      aria-label={
        isSelected
          ? textEditing
            ? "Text — editing"
            : "Text — click to edit"
          : undefined
      }
      onDoubleClick={(event) => {
        event.stopPropagation()
        if (!isSelected) {
          return
        }
        const t = event.target as HTMLElement
        if (t.closest("[data-designer-text-handle]")) {
          return
        }
        flushSync(() => {
          setTextEditing(true)
        })
        const el = textareaRef.current
        el?.focus({ preventScroll: true })
        el?.select()
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
        tabIndex={isSelected || textEditing ? 0 : -1}
        className={cn(
          "absolute right-0 left-0 z-[25] box-border w-full resize-none border-0 bg-transparent px-0.5 py-0 outline-none focus-visible:ring-0",
          !clipToBounds &&
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          sizing === "auto-width" && "whitespace-pre"
        )}
        style={{
          top: 0,
          bottom: 0,
          // Inline overflow beats UA `textarea { overflow: auto }` so unclipped text can paint past the box.
          overflow: clipToBounds ? "hidden" : "visible",
          overscrollBehavior: "none",
          fontSize: fontPx,
          lineHeight:
            resolveTextLayerLineHeightUnit(layer) === "auto"
              ? "normal"
              : `${textLineHeightTrimPx(layer, null) * displayScale}px`,
          fontFamily,
          fontWeight,
          color,
          textAlign: resolveTextLayerTextAlign(layer),
          textDecorationLine: resolveTextLayerTextDecorationLine(layer),
          textTransform: resolveTextLayerTextTransform(layer),
          letterSpacing: resolveTextLayerLetterSpacingCss(layer),
          // Match canvas `textBaseline: "top"` + `verticalTextOffsetTrimPx`: no extra rem padding
          // (asymmetric pb used to pull middle alignment off center).
          paddingTop: `${textVerticalOffsetTrim * displayScale}px`,
        }}
        value={layer.text}
        placeholder="Type…"
        onChange={(event) => onUpdate({ text: event.target.value })}
        onMouseDown={(event) => {
          if (event.detail === 2) {
            flushSync(() => {
              setTextEditing(true)
            })
            event.preventDefault()
            const el = textareaRef.current
            el?.focus({ preventScroll: true })
            el?.select()
            return
          }
          if (isSelected && !textEditing && event.detail === 1) {
            flushSync(() => {
              setTextEditing(true)
            })
            event.preventDefault()
            const el = textareaRef.current
            el?.focus({ preventScroll: true })
            el?.select()
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
          flushSync(() => {
            setTextEditing(true)
          })
          const el = textareaRef.current
          el?.focus({ preventScroll: true })
          el?.select()
        }}
        onFocus={(event) => {
          event.currentTarget.select()
        }}
        onBlur={() => {
          setTextEditing(false)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            setTextEditing(false)
            event.currentTarget.blur()
            return
          }
          if (
            textEditing &&
            (event.key === "Delete" || event.key === "Backspace") &&
            layer.text.length > 0
          ) {
            event.stopPropagation()
            return
          }
          // Parent frame uses `role="button"`; without this, Enter / Space bubble and
          // activate that control instead of inserting a newline or a space in the field.
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation()
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
            className="pointer-events-auto absolute top-0 right-3 left-3 z-[28] cursor-grab active:cursor-grabbing"
            style={{ height: dragStripCssPx }}
            onPointerDown={startMove}
            onClick={(event) => event.stopPropagation()}
          />
          <div
            data-designer-text-drag
            aria-label="Drag to move text"
            className="pointer-events-auto absolute right-3 bottom-0 left-3 z-[28] cursor-grab active:cursor-grabbing"
            style={{ height: dragStripCssPx }}
            onPointerDown={startMove}
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north-west"
            className={cn(handleBase, cursorFor.nw, "top-0 left-0")}
            style={{
              transform: `translate(calc(-50% - ${HANDLE_STICK_OUT}), calc(-50% - ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("nw", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north"
            className={cn(handleBase, cursorFor.n, "top-0 left-1/2")}
            style={{
              transform: `translate(-50%, calc(-50% - ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("n", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize north-east"
            className={cn(handleBase, cursorFor.ne, "top-0 left-full")}
            style={{
              transform: `translate(calc(-50% + ${HANDLE_STICK_OUT}), calc(-50% - ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("ne", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize east"
            className={cn(handleBase, cursorFor.e, "top-1/2 left-full")}
            style={{
              transform: `translate(calc(-50% + ${HANDLE_STICK_OUT}), -50%)`,
            }}
            onPointerDown={(e) => startResize("e", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south-east"
            className={cn(handleBase, cursorFor.se, "top-full left-full")}
            style={{
              transform: `translate(calc(-50% + ${HANDLE_STICK_OUT}), calc(-50% + ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("se", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south"
            className={cn(handleBase, cursorFor.s, "top-full left-1/2")}
            style={{
              transform: `translate(-50%, calc(-50% + ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("s", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize south-west"
            className={cn(handleBase, cursorFor.sw, "top-full left-0")}
            style={{
              transform: `translate(calc(-50% - ${HANDLE_STICK_OUT}), calc(-50% + ${HANDLE_STICK_OUT}))`,
            }}
            onPointerDown={(e) => startResize("sw", e)}
          />
          <button
            type="button"
            data-designer-text-handle
            aria-label="Resize west"
            className={cn(handleBase, cursorFor.w, "top-1/2 left-0")}
            style={{
              transform: `translate(calc(-50% - ${HANDLE_STICK_OUT}), -50%)`,
            }}
            onPointerDown={(e) => startResize("w", e)}
          />
        </>
      ) : null}
    </div>
  )
}
