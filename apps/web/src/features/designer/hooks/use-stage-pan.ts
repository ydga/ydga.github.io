import { useCallback, useState } from "react"

type PanOffset = { x: number; y: number }

type DragState = {
  pointerId: number | null
  startX: number
  startY: number
  originX: number
  originY: number
}

type StagePanState = {
  resetKey: string
  pan: PanOffset
  isDragging: boolean
  drag: DragState
}

type UseStagePanOptions = {
  enabled: boolean
  resetKey: string
}

function createInitialState(resetKey: string): StagePanState {
  return {
    resetKey,
    pan: { x: 0, y: 0 },
    isDragging: false,
    drag: {
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    },
  }
}

export function useStagePan({ enabled, resetKey }: UseStagePanOptions) {
  const [state, setState] = useState<StagePanState>(() =>
    createInitialState(resetKey)
  )

  if (state.resetKey !== resetKey) {
    setState(createInitialState(resetKey))
  }

  const endDrag = useCallback((event: React.PointerEvent) => {
    setState((current) => {
      if (current.drag.pointerId !== event.pointerId) {
        return current
      }

      return {
        ...current,
        isDragging: false,
        drag: {
          ...current.drag,
          pointerId: null,
        },
      }
    })

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
          "input, button, textarea, select, a, [contenteditable=true], [data-designer-text-drag], [data-designer-text-handle]"
        ) ||
        target.closest("[data-slot=input-group-control]")
      ) {
        return
      }

      setState((current) => ({
        ...current,
        isDragging: true,
        drag: {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: current.pan.x,
          originY: current.pan.y,
        },
      }))
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    },
    [enabled]
  )

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    setState((current) => {
      if (current.drag.pointerId !== event.pointerId) {
        return current
      }

      return {
        ...current,
        pan: {
          x: current.drag.originX + event.clientX - current.drag.startX,
          y: current.drag.originY + event.clientY - current.drag.startY,
        },
      }
    })
  }, [])

  return {
    pan: state.pan,
    isDragging: state.isDragging,
    canPan: enabled,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
}
