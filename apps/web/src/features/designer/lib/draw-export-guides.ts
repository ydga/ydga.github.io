import type {
  CanvasSettings,
  ExportBurnInSettings,
} from "@/features/designer/model/types"
import {
  getCropMarkLines,
  getCropMarkSpec,
} from "@/features/designer/lib/crop-marks"
import { getGuideGeometry } from "@/features/designer/lib/print-zones"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import { isPrintDocument } from "@/features/designer/lib/document-intent"

type GuideStroke = {
  color: string
  dash?: number[]
  width?: number
  opacity?: number
}

function strokeRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: GuideStroke
) {
  context.save()
  context.strokeStyle = stroke.color
  context.lineWidth = stroke.width ?? 1
  context.globalAlpha = stroke.opacity ?? 1
  if (stroke.dash) {
    context.setLineDash(stroke.dash)
  }
  context.strokeRect(
    x + 0.5,
    y + 0.5,
    Math.max(width - 1, 0),
    Math.max(height - 1, 0)
  )
  context.restore()
}

function strokeLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: GuideStroke
) {
  context.save()
  context.strokeStyle = stroke.color
  context.lineWidth = stroke.width ?? 1
  context.globalAlpha = stroke.opacity ?? 1
  if (stroke.dash) {
    context.setLineDash(stroke.dash)
  }
  context.beginPath()
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)
  context.stroke()
  context.restore()
}

export function drawExportGuides(
  context: CanvasRenderingContext2D,
  settings: CanvasSettings,
  burnIn: ExportBurnInSettings
) {
  const geometry = getGuideGeometry(settings)
  const { trim, safe, exportWidthPx, exportHeightPx } = geometry
  const { print } = settings
  const printDoc = isPrintDocument(settings)

  const trimStroke: GuideStroke = { color: "#171717" }
  const bleedStroke: GuideStroke = { color: "#dc2626", dash: [4, 3] }
  const safeStroke: GuideStroke = { color: "#2563eb", dash: [6, 4] }
  const centerStroke: GuideStroke = {
    color: "#ff00ff",
    dash: [4, 4],
    opacity: 0.85,
  }
  const thirdsStroke: GuideStroke = {
    color: "#06b6d4",
    dash: [2, 4],
    opacity: 0.85,
  }

  if (burnIn.bleed && print.bleedEnabled && printDoc) {
    strokeRect(context, 0, 0, exportWidthPx, exportHeightPx, bleedStroke)
  }

  if (burnIn.trim && printDoc) {
    const { bleedPx } = getExportDimensions(settings)
    const cropMarkSpec = getCropMarkSpec(settings, bleedPx)
    for (const line of getCropMarkLines(trim, cropMarkSpec)) {
      strokeLine(context, line.x1, line.y1, line.x2, line.y2, trimStroke)
    }
  }

  if (burnIn.safe && print.safeEnabled && printDoc) {
    strokeRect(context, safe.x, safe.y, safe.width, safe.height, safeStroke)
  }

  const centerX = trim.x + trim.width / 2
  const centerY = trim.y + trim.height / 2

  if (burnIn.center) {
    strokeLine(
      context,
      centerX,
      trim.y,
      centerX,
      trim.y + trim.height,
      centerStroke
    )
    strokeLine(
      context,
      trim.x,
      centerY,
      trim.x + trim.width,
      centerY,
      centerStroke
    )
  }

  if (burnIn.thirds) {
    for (const fraction of [1 / 3, 2 / 3]) {
      strokeLine(
        context,
        trim.x + trim.width * fraction,
        trim.y,
        trim.x + trim.width * fraction,
        trim.y + trim.height,
        thirdsStroke
      )
      strokeLine(
        context,
        trim.x,
        trim.y + trim.height * fraction,
        trim.x + trim.width,
        trim.y + trim.height * fraction,
        thirdsStroke
      )
    }
  }
}
