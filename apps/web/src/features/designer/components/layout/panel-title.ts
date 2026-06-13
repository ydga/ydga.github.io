import type { Selection } from "@/features/designer/model/ui-types"
import { DEFAULT_PAGE_NAME } from "@/features/designer/model/frames"

export function getFramePanelTitle(frameName: string): string {
  const trimmed = frameName.trim()
  if (!trimmed || trimmed === DEFAULT_PAGE_NAME) {
    return "Frame"
  }

  return trimmed
}

export function getPanelTitle(selection: Selection) {
  return selection.kind === "page" ? "Page" : "Object"
}
