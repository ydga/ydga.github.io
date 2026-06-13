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
export type PanelMode = "document" | "export"

export const DEFAULT_PAGE_ID = "page-1"
export const MIN_VIEWPORT_ZOOM = 0.05
export const MAX_VIEWPORT_ZOOM = 4
export const ZOOM_STEP = 1.1
