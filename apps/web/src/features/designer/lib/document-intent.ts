import type {
  CanvasSettings,
  DimensionUnit,
  DocumentIntent,
} from "@/features/designer/model/types"
import type { DesignerFrame } from "@/features/designer/model/frames"

export type { DocumentIntent }

export function intentToUnit(intent: DocumentIntent): DimensionUnit {
  return intent === "screen" ? "px" : "cm"
}

export function unitToIntent(unit: DimensionUnit): DocumentIntent {
  return unit === "px" ? "screen" : "print"
}

export function getDocumentIntent(settings: CanvasSettings): DocumentIntent {
  return unitToIntent(settings.unit)
}

export function isScreenDocument(settings: CanvasSettings) {
  return getDocumentIntent(settings) === "screen"
}

export function isPrintDocument(settings: CanvasSettings) {
  return getDocumentIntent(settings) === "print"
}

export function getDocumentIntentLabel(settings: CanvasSettings) {
  return isScreenDocument(settings) ? "Screen" : "Print"
}

export function getDimensionStep(intent: DocumentIntent) {
  return intent === "screen" ? 1 : 0.1
}

export function getDimensionMin(intent: DocumentIntent) {
  return intent === "screen" ? 1 : 0.1
}

export function hasMixedExportIntents(frames: DesignerFrame[]): boolean {
  if (frames.length < 2) {
    return false
  }

  let hasScreen = false
  let hasPrint = false

  for (const frame of frames) {
    if (isScreenDocument(frame.settings)) {
      hasScreen = true
    } else {
      hasPrint = true
    }

    if (hasScreen && hasPrint) {
      return true
    }
  }

  return false
}

export function hasExportSyncGroup(frames: DesignerFrame[]): boolean {
  let screenCount = 0
  let printCount = 0

  for (const frame of frames) {
    if (isScreenDocument(frame.settings)) {
      screenCount += 1
    } else {
      printCount += 1
    }
  }

  return screenCount > 1 || printCount > 1
}
