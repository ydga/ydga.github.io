import type {
  CanvasSettings,
  DimensionUnit,
  DocumentIntent,
} from "@/features/designer/model/types"

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
