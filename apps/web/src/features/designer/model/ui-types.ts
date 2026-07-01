export type PageSelection = {
  kind: "page"
  pageId: string
}

export type ElementSelection = {
  kind: "element"
  pageId: string
  elementId: string
}

export type Selection = PageSelection | ElementSelection

export type ZoomMode = "fit" | "manual"
export type CanvasTool = "select" | "text" | "shape"
export type ShapeVariant = "circle" | "square" | "triangle" | "line"
export type PanelMode = "document" | "export" | "layers"
export type ToolbarTool = "pointer" | "text" | "shape" | "export"

export function resolveContextPanelMode(
  toolbarTool: ToolbarTool,
  panelMode: PanelMode,
  selection: Selection,
  frameEngagedId: string | null
): PanelMode {
  if (toolbarTool === "export") {
    return "export"
  }

  if (toolbarTool === "pointer") {
    if (selection.kind === "element") {
      return "document"
    }

    if (
      selection.kind === "page" &&
      frameEngagedId != null &&
      frameEngagedId === selection.pageId
    ) {
      return "document"
    }

    return "layers"
  }

  return panelMode
}

export const DEFAULT_FRAME_ID = "frame-1"
/** @deprecated Use DEFAULT_FRAME_ID */
export const DEFAULT_PAGE_ID = DEFAULT_FRAME_ID
export const MIN_VIEWPORT_ZOOM = 0.05
export const MAX_VIEWPORT_ZOOM = 4
export const ZOOM_WHEEL_SENSITIVITY = 0.003
