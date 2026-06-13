import type { Selection } from "@/features/designer/model/ui-types"

export function getPanelTitle(selection: Selection) {
  return selection.kind === "page" ? "Frame" : "Object"
}
