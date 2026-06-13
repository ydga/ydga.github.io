import { useCallback, useEffect, useRef, useState } from "react"

type PanOffset = { x: number; y: number }

type UseStagePanOptions = {
  enabled: boolean
  resetKey: string
}

export function useStagePan({ enabled, resetKey }: UseStagePanOptions) {
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const panRef = useRef<PanOffset>({ x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number | null
    startX: number
    startY: number
    originX: number
    originY: number
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  useEffect(() => {
    setPan({ x: 0, y: 0 })
    panRef.current = { x: 0, y: 0 }
    dragRef.current.pointerId = null
    setIsDragging(false)
  }, [resetKey])

  const endDrag = useCallback((event: React.PointerEvent) => {
    if (dragRef.current.pointerId !== event.pointerId) {
      return
    }

    dragRef.current.pointerId = null
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) {
        return
      }

      const target = event.target as HTMLElement
      if (
        target.closest(
          "input, button, textarea, select, a, [contenteditable=true]"
        ) ||
        target.closest("[data-slot=input-group-control]")
      ) {
        return
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: panRef.current.x,
        originY: panRef.current.y,
      }
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    },
    [enabled]
  )

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (dragRef.current.pointerId !== event.pointerId) {
      return
    }

    const next = {
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    }
    panRef.current = next
    setPan(next)
  }, [])

  return {
    pan,
    isDragging,
    canPan: enabled,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
}
