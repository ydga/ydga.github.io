import { useCallback, useRef, useState } from "react"

import {
  DEFAULT_PAGE_ID,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  ZOOM_STEP,
  type Selection,
  type ZoomMode,
} from "@/features/designer/model/ui-types"

function clampZoom(value: number) {
  return Math.min(Math.max(value, MIN_VIEWPORT_ZOOM), MAX_VIEWPORT_ZOOM)
}

export function useDesignerUi() {
  const [selection, setSelection] = useState<Selection>({
    kind: "page",
    pageId: DEFAULT_PAGE_ID,
  })
  const [panelOpen, setPanelOpen] = useState(true)
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit")
  const [manualZoom, setManualZoom] = useState(1)
  const [pageName, setPageName] = useState("Page 1")
  const [fitScale, setFitScale] = useState(1)

  const fitScaleRef = useRef(fitScale)
  const zoomModeRef = useRef(zoomMode)
  const manualZoomRef = useRef(manualZoom)
  fitScaleRef.current = fitScale
  zoomModeRef.current = zoomMode
  manualZoomRef.current = manualZoom

  const selectPage = useCallback((pageId: string = DEFAULT_PAGE_ID) => {
    setSelection({ kind: "page", pageId })
  }, [])

  const selectPageAndOpen = useCallback((pageId: string = DEFAULT_PAGE_ID) => {
    setSelection({ kind: "page", pageId })
    setPanelOpen(true)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open)
  }, [])

  const effectiveScale = zoomMode === "fit" ? fitScale : manualZoom

  const zoomIn = useCallback(() => {
    const base =
      zoomModeRef.current === "fit"
        ? fitScaleRef.current
        : manualZoomRef.current
    setZoomMode("manual")
    setManualZoom(clampZoom(base * ZOOM_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    const base =
      zoomModeRef.current === "fit"
        ? fitScaleRef.current
        : manualZoomRef.current
    setZoomMode("manual")
    setManualZoom(clampZoom(base / ZOOM_STEP))
  }, [])

  const zoomFit = useCallback(() => {
    setZoomMode("fit")
  }, [])

  return {
    selection,
    selectPage,
    selectPageAndOpen,
    panelOpen,
    setPanelOpen,
    togglePanel,
    zoomMode,
    manualZoom,
    fitScale,
    setFitScale,
    effectiveScale,
    zoomIn,
    zoomOut,
    zoomFit,
    pageName,
    setPageName,
  }
}

export type DesignerUi = ReturnType<typeof useDesignerUi>
