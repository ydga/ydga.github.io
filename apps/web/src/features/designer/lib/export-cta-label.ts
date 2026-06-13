import {
  isPrintDocument,
  isScreenDocument,
} from "@/features/designer/lib/document-intent"
import type { CanvasSettings } from "@/features/designer/model/types"

export function getExportCtaLabel(
  targets: { settings: CanvasSettings }[]
): string {
  if (targets.length === 0) {
    return "Export"
  }

  if (targets.length === 1) {
    const settings = targets[0].settings
    if (isPrintDocument(settings)) {
      return "Export PDF"
    }

    return "Export 1 image"
  }

  const allScreen = targets.every((target) => isScreenDocument(target.settings))
  if (allScreen) {
    return `Export ${targets.length} images`
  }

  const allPrint = targets.every((target) => isPrintDocument(target.settings))
  if (allPrint) {
    return `Export ${targets.length} PDFs`
  }

  return `Export ${targets.length} files`
}
