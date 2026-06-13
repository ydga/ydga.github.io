import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"
import type { CanvasPreset } from "@/features/designer/model/presets"
import { getSuggestedPageName } from "@/features/designer/state/use-page-name-sync"
import {
  DEFAULT_PAGE_ID,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  ZOOM_STEP,
  type Selection,
  type ZoomMode,
  type PanelMode,
} from "@/features/designer/model/ui-types"
import type { CanvasSettings } from "@/features/designer/model/types"

function clampZoom(value: number) {
  return Math.min(Math.max(value, MIN_VIEWPORT_ZOOM), MAX_VIEWPORT_ZOOM)
}

export type PageNameSource = "auto" | "manual"

export function useDesignerUi() {
  const [selection, setSelection] = useState<Selection>({
    kind: "page",
    pageId: DEFAULT_PAGE_ID,
  })
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelMode, setPanelMode] = useState<PanelMode>("document")
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit")
  const [manualZoom, setManualZoom] = useState(1)
  const [pageName, setPageNameState] = useState(() =>
    getSuggestedPageName(DEFAULT_CANVAS_SETTINGS)
  )
  const [pageNameSource, setPageNameSource] = useState<PageNameSource>("auto")
  const [fitScale, setFitScale] = useState(1)

  const fitScaleRef = useRef(fitScale)
  const zoomModeRef = useRef(zoomMode)
  const manualZoomRef = useRef(manualZoom)

  useEffect(() => {
    fitScaleRef.current = fitScale
    zoomModeRef.current = zoomMode
    manualZoomRef.current = manualZoom
  }, [fitScale, zoomMode, manualZoom])

  const selectPage = useCallback((pageId: string = DEFAULT_PAGE_ID) => {
    setSelection({ kind: "page", pageId })
  }, [])

  const selectPageAndOpen = useCallback((pageId: string = DEFAULT_PAGE_ID) => {
    setSelection({ kind: "page", pageId })
    setPanelMode("document")
    setPanelOpen(true)
  }, [])

  const openDocumentPanel = useCallback(() => {
    setSelection({ kind: "page", pageId: DEFAULT_PAGE_ID })
    setPanelMode("document")
    setPanelOpen(true)
  }, [])

  const openExportPanel = useCallback(() => {
    setSelection({ kind: "page", pageId: DEFAULT_PAGE_ID })
    setPanelMode("export")
    setPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open)
  }, [])

  const setPageName = useCallback((name: string) => {
    setPageNameState(name)
    setPageNameSource("manual")
  }, [])

  const setPageNameFromPreset = useCallback((preset: CanvasPreset) => {
    setPageNameState(preset.label)
    setPageNameSource("auto")
  }, [])

  const syncPageNameFromSettings = useCallback((settings: CanvasSettings) => {
    setPageNameState(getSuggestedPageName(settings))
    setPageNameSource("auto")
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
    panelMode,
    setPanelMode,
    openDocumentPanel,
    openExportPanel,
    closePanel,
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
    pageNameSource,
    setPageName,
    setPageNameFromPreset,
    syncPageNameFromSettings,
  }
}

export type DesignerUi = ReturnType<typeof useDesignerUi>
