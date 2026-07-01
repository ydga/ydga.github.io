import type { CanvasSettings } from "@/features/designer/model/types"

export function resolveFrameClipContent(settings: CanvasSettings) {
  return settings.clipContent === true
}

/** Whether layer chrome and paint may extend past the frame trim in the editor. */
export function frameAllowsElementOverflow(
  settings: CanvasSettings,
  showBleedPreview: boolean
) {
  if (showBleedPreview) {
    return true
  }

  return !resolveFrameClipContent(settings)
}
