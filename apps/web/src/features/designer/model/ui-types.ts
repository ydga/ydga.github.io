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
export type PanelMode = "document" | "export" | "layers"

export const DEFAULT_FRAME_ID = "frame-1"
/** @deprecated Use DEFAULT_FRAME_ID */
export const DEFAULT_PAGE_ID = DEFAULT_FRAME_ID
export const MIN_VIEWPORT_ZOOM = 0.05
export const MAX_VIEWPORT_ZOOM = 4
export const ZOOM_WHEEL_SENSITIVITY = 0.003
