import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { valueFromScrubDelta } from "./scrub-number"

const SCRUB_THRESHOLD_PX = 3

type UseScrubNumberOptions = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  pixelsPerStep?: number
}

export function useScrubNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  pixelsPerStep = 1,
}: UseScrubNumberOptions) {
  const stateRef = useRef({
    startX: 0,
    startValue: 0,
    scrubbing: false,
  })
  const suppressClickRef = useRef(false)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const stopScrubbing = useCallback(() => {
    if (stateRef.current.scrubbing) {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    stateRef.current.scrubbing = false
    setIsScrubbing(false)
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) {
        return
      }

      stateRef.current = {
        startX: event.clientX,
        startValue: value,
        scrubbing: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [disabled, value]
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) {
        return
      }

      const deltaX = event.clientX - stateRef.current.startX
      if (
        !stateRef.current.scrubbing &&
        Math.abs(deltaX) < SCRUB_THRESHOLD_PX
      ) {
        return
      }

      if (!stateRef.current.scrubbing) {
        stateRef.current.scrubbing = true
        suppressClickRef.current = true
        setIsScrubbing(true)
        document.body.style.cursor = "ew-resize"
        document.body.style.userSelect = "none"

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }

      onChange(
        valueFromScrubDelta(stateRef.current.startValue, deltaX, step, {
          min,
          max,
          shiftKey: event.shiftKey,
          pixelsPerStep,
        })
      )
    },
    [disabled, max, min, onChange, pixelsPerStep, step]
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return
      }

      event.currentTarget.releasePointerCapture(event.pointerId)
      stopScrubbing()
    },
    [stopScrubbing]
  )

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }, [])

  return {
    isScrubbing,
    scrubHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  }
}
