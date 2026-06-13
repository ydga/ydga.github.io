import { useLayoutEffect, useRef, useState } from "react"

import {
  computeFitScale,
  getStageSafeAreaInset,
  VIEWPORT_FIT_MARGIN,
} from "@/features/designer/lib/fit-viewport"

type UseStageFitOptions = {
  exportWidthPx: number
  onFitScaleChange: (scale: number) => void
  toolbarChromeRef: React.RefObject<HTMLElement | null>
  zoomChromeRef: React.RefObject<HTMLElement | null>
}

const FIT_SCALE_EPSILON = 0.0001
const INSET_EPSILON = 0.5

export function useStageFit({
  exportWidthPx,
  onFitScaleChange,
  toolbarChromeRef,
  zoomChromeRef,
}: UseStageFitOptions) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [safeAreaInset, setSafeAreaInset] = useState(VIEWPORT_FIT_MARGIN)
  const lastFitRef = useRef({ inset: VIEWPORT_FIT_MARGIN, scale: 1 })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    lastFitRef.current = { inset: -1, scale: -1 }

    function updateFit() {
      const bounds = viewport?.getBoundingClientRect()
      if (!bounds) {
        return
      }

      const inset = getStageSafeAreaInset(
        bounds,
        toolbarChromeRef.current?.getBoundingClientRect(),
        zoomChromeRef.current?.getBoundingClientRect()
      )
      const scale = computeFitScale(exportWidthPx, bounds.width, inset)

      if (Math.abs(lastFitRef.current.inset - inset) > INSET_EPSILON) {
        lastFitRef.current.inset = inset
        setSafeAreaInset(inset)
      }

      if (Math.abs(lastFitRef.current.scale - scale) > FIT_SCALE_EPSILON) {
        lastFitRef.current.scale = scale
        onFitScaleChange(scale)
      }
    }

    updateFit()

    const observer = new ResizeObserver(updateFit)
    observer.observe(viewport)

    const toolbar = toolbarChromeRef.current
    const zoom = zoomChromeRef.current

    if (toolbar) {
      observer.observe(toolbar)
    }

    if (zoom) {
      observer.observe(zoom)
    }

    window.addEventListener("resize", updateFit)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateFit)
    }
  }, [exportWidthPx, onFitScaleChange, toolbarChromeRef, zoomChromeRef])

  return { viewportRef, scrollRef, safeAreaInset }
}
