import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FRAME_ID,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  type CanvasTool,
  type PanelMode,
  type Selection,
  type ShapeVariant,
  type ToolbarTool,
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
  const [frameEngagedId, setFrameEngagedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelPinned, setPanelPinned] = useState(true)
  const [panelMode, setPanelMode] = useState<PanelMode>("layers")
  const [toolbarTool, setToolbarTool] = useState<ToolbarTool>("pointer")
  const [canvasTool, setCanvasToolState] = useState<CanvasTool>("select")
  const [shapeVariant, setShapeVariant] = useState<ShapeVariant>("square")
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

  const selectElement = useCallback((pageId: string, elementId: string) => {
    setFrameEngagedId(null)
    setSelection({ kind: "element", pageId, elementId })
  }, [])

  const toggleElementSelection = useCallback(
    (pageId: string, elementId: string) => {
      setSelection((prev) => {
        if (
          prev.kind === "element" &&
          prev.pageId === pageId &&
          prev.elementId === elementId
        ) {
          return { kind: "page", pageId }
        }
        return { kind: "element", pageId, elementId }
      })
    },
    []
  )

  const selectToolbarTool = useCallback(
    (tool: ToolbarTool, pageId: string = DEFAULT_FRAME_ID) => {
      setToolbarTool(tool)

      if (tool === "pointer") {
        setCanvasToolState("select")
        return
      }

      if (tool === "text") {
        setCanvasToolState("text")
        return
      }

      if (tool === "shape") {
        setCanvasToolState("shape")
        return
      }

      setCanvasToolState("select")
      setPanelMode(tool)
      setPanelOpen(true)
    },
    []
  )

  const selectTextTool = useCallback(() => {
    selectToolbarTool("text")
  }, [selectToolbarTool])

  const selectShapeTool = useCallback(
    (variant?: ShapeVariant) => {
      if (variant) {
        setShapeVariant(variant)
      }
      selectToolbarTool("shape")
    },
    [selectToolbarTool]
  )

  const selectPointerTool = useCallback(() => {
    selectToolbarTool("pointer")
  }, [selectToolbarTool])

  const selectPageAndOpen = useCallback((pageId: string = DEFAULT_FRAME_ID) => {
    setToolbarTool("pointer")
    setCanvasToolState("select")
    setFrameEngagedId(pageId)
    setSelection({ kind: "page", pageId })
    setPanelMode("document")
    setPanelOpen(true)
  }, [])

  const dismissFrameSettings = useCallback(() => {
    setFrameEngagedId(null)
    if (toolbarTool === "pointer") {
      setPanelOpen(false)
    }
  }, [toolbarTool])

  /** Switches panel mode and opens the panel. Pinning is only via `togglePanelPin` (sidebar control). */
  const togglePanelView = useCallback((view: PanelMode) => {
    setPanelMode(view)
    setPanelOpen(true)
  }, [])

  const togglePanelPin = useCallback(() => {
    setPanelPinned((pinned) => !pinned)
  }, [])

  const effectiveScale = zoomMode === "fit" ? fitScale : manualZoom

  const setZoomScale = useCallback((value: number) => {
    setZoomMode("manual")
    setManualZoom(clampZoom(value))
  }, [])

  /** Keep the context panel in sync with toolbar tool and canvas selection. */
  useEffect(() => {
    queueMicrotask(() => {
      if (toolbarTool === "export") {
        setPanelMode("export")
        if (panelPinned) {
          setPanelOpen(true)
        }
        return
      }

      if (toolbarTool === "pointer") {
        if (selection.kind === "element") {
          setPanelMode("document")
          setPanelOpen(true)
          return
        }

        if (frameEngagedId === selection.pageId) {
          setPanelMode("document")
          if (panelPinned) {
            setPanelOpen(true)
          }
          return
        }

        setPanelMode("layers")
        return
      }

      if (selection.kind === "element") {
        setPanelMode("document")
        setPanelOpen(true)
      }
    })
  }, [toolbarTool, selection, panelPinned, frameEngagedId])

  const isFramePanelEngaged =
    selection.kind === "page" && frameEngagedId === selection.pageId

  const isPanelVisible = panelPinned
    ? panelOpen &&
      (selection.kind === "element" ||
        isFramePanelEngaged ||
        toolbarTool === "export")
    : selection.kind === "element" ||
      isFramePanelEngaged ||
      toolbarTool === "export"

  const zoomFit = useCallback(() => {
    setZoomMode("fit")
  }, [])

  return {
    selection,
    frameEngagedId,
    selectPage,
    selectElement,
    toggleElementSelection,
    selectPageAndOpen,
    dismissFrameSettings,
    toolbarTool,
    selectToolbarTool,
    canvasTool,
    shapeVariant,
    setShapeVariant,
    selectTextTool,
    selectShapeTool,
    selectPointerTool,
    panelOpen,
    setPanelOpen,
    panelPinned,
    isPanelVisible,
    panelMode,
    setPanelMode,
    togglePanelView,
    togglePanelPin,
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
