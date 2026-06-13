import { useLayoutEffect, useRef, useState } from "react"

import {
  computeFitScale,
  getStageEdgeInsets,
  getStageSafeAreaInset,
  VIEWPORT_FIT_MARGIN,
} from "@/features/designer/lib/fit-viewport"

type UseStageFitOptions = {
  contentWidthPx: number
  contentHeightPx: number
  onFitScaleChange: (scale: number) => void
  toolbarChromeRef: React.RefObject<HTMLElement | null>
  bottomChromeRef: React.RefObject<HTMLElement | null>
}

const FIT_SCALE_EPSILON = 0.0001
const INSET_EPSILON = 0.5

export function useStageFit({
  contentWidthPx,
  contentHeightPx,
  onFitScaleChange,
  toolbarChromeRef,
  bottomChromeRef,
}: UseStageFitOptions) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
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

      const toolbarRect = toolbarChromeRef.current?.getBoundingClientRect()
      const bottomChromeRect = bottomChromeRef.current?.getBoundingClientRect()
      const edgeInsets = getStageEdgeInsets(
        bounds,
        toolbarRect,
        bottomChromeRect
      )
      const inset = getStageSafeAreaInset(bounds, toolbarRect, bottomChromeRect)
      const scale = computeFitScale(
        contentWidthPx,
        contentHeightPx,
        bounds,
        edgeInsets
      )

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
    const bottomChrome = bottomChromeRef.current

    if (toolbar) {
      observer.observe(toolbar)
    }

    if (bottomChrome) {
      observer.observe(bottomChrome)
    }

    window.addEventListener("resize", updateFit)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateFit)
    }
  }, [
    contentWidthPx,
    contentHeightPx,
    onFitScaleChange,
    toolbarChromeRef,
    bottomChromeRef,
  ])

  return { viewportRef, stageRef, safeAreaInset }
}
