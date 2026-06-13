import { useCallback, useState } from "react"

import {
  DEFAULT_FRAME_ID,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  type PanelMode,
  type Selection,
  type ZoomMode,
} from "@/features/designer/model/ui-types"

function clampZoom(value: number) {
  return Math.min(Math.max(value, MIN_VIEWPORT_ZOOM), MAX_VIEWPORT_ZOOM)
}

export function useDesignerUi() {
  const [selection, setSelection] = useState<Selection>({
    kind: "page",
    pageId: DEFAULT_FRAME_ID,
  })
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelMode, setPanelMode] = useState<PanelMode>("document")
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit")
  const [manualZoom, setManualZoom] = useState(1)
  const [fitScale, setFitScaleState] = useState(1)

  const setFitScale = useCallback((scale: number) => {
    setFitScaleState((current) =>
      Math.abs(current - scale) < 0.0001 ? current : scale
    )
  }, [])

  const selectPage = useCallback((pageId: string = DEFAULT_FRAME_ID) => {
    setSelection({ kind: "page", pageId })
  }, [])

  const selectPageAndOpen = useCallback((pageId: string = DEFAULT_FRAME_ID) => {
    setSelection({ kind: "page", pageId })
    setPanelMode("document")
    setPanelOpen(true)
  }, [])

  const togglePanelView = useCallback(
    (view: PanelMode) => {
      if (panelOpen && panelMode === view) {
        setPanelOpen(false)
        return
      }

      setPanelMode(view)
      setPanelOpen(true)
    },
    [panelMode, panelOpen]
  )

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open)
  }, [])

  const effectiveScale = zoomMode === "fit" ? fitScale : manualZoom

  const setZoomScale = useCallback((value: number) => {
    setZoomMode("manual")
    setManualZoom(clampZoom(value))
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
    panelMode,
    setPanelMode,
    togglePanelView,
    closePanel,
    togglePanel,
    zoomMode,
    manualZoom,
    fitScale,
    setFitScale,
    effectiveScale,
    setZoomScale,
    zoomFit,
  }
}

export type DesignerUi = ReturnType<typeof useDesignerUi>
