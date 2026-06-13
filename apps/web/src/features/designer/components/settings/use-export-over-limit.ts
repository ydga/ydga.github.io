import { isExportOverLimit } from "@/features/designer/lib/dimensions"
import type { CanvasSettings } from "@/features/designer/model/types"

export function useExportOverLimit(settings: CanvasSettings) {
  return isExportOverLimit(settings)
}
