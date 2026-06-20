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
export type ToolbarTool = "pointer" | "text" | "shape" | "document" | "export"

export function resolveContextPanelMode(
  toolbarTool: ToolbarTool,
  panelMode: PanelMode,
  selection: Selection
): PanelMode {
  if (toolbarTool === "export") {
    return "export"
  }

  if (toolbarTool === "document") {
    return "document"
  }

  if (toolbarTool === "pointer") {
    return selection.kind === "page" ? "layers" : "document"
  }

  return panelMode
}

export const DEFAULT_FRAME_ID = "frame-1"
/** @deprecated Use DEFAULT_FRAME_ID */
export const DEFAULT_PAGE_ID = DEFAULT_FRAME_ID
export const MIN_VIEWPORT_ZOOM = 0.05
export const MAX_VIEWPORT_ZOOM = 4
export const ZOOM_WHEEL_SENSITIVITY = 0.003
