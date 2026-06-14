import { jsPDF } from "jspdf"

import { drawExportGuides } from "@/features/designer/lib/draw-export-guides"
import {
  isPrintDocument,
  isScreenDocument,
} from "@/features/designer/lib/document-intent"
import { getExportDimensions } from "@/features/designer/lib/dimensions"
import {
  mergeExportOverrides,
  type PageExportOverrides,
} from "@/features/designer/lib/export-settings"
import { renderBackground } from "@/features/designer/lib/render-background"
import type { CanvasSettings } from "@/features/designer/model/types"

const JPEG_QUALITY = 0.92

export type ExportJob = {
  pageName: string
  settings: CanvasSettings
  overrides: PageExportOverrides
  sourceCanvas: HTMLCanvasElement | null
}

function sanitizeFilename(name: string) {
  const trimmed = name.trim() || "Untitled"
  return trimmed.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-")
}

export async function renderExportCanvas(
  settings: CanvasSettings,
  sourceCanvas: HTMLCanvasElement | null
): Promise<HTMLCanvasElement> {
  const exportDimensions = getExportDimensions(settings)
  const { exportWidthPx, exportHeightPx } = exportDimensions

  const canvas = document.createElement("canvas")
  canvas.width = exportWidthPx
  canvas.height = exportHeightPx

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not create export canvas context")
  }

  context.clearRect(0, 0, exportWidthPx, exportHeightPx)

  if (
    sourceCanvas &&
    sourceCanvas.width === exportWidthPx &&
    sourceCanvas.height === exportHeightPx
  ) {
    context.drawImage(sourceCanvas, 0, 0)
  } else {
    await renderBackground(
      context,
      exportWidthPx,
      exportHeightPx,
      settings.background
    )
  }

  drawExportGuides(context, settings, settings.export.burnIn)

  return canvas
}

export async function downloadExport(
  settings: CanvasSettings,
  sourceCanvas: HTMLCanvasElement | null,
  pageName: string
) {
  await downloadExports([
    {
      pageName,
      settings,
      overrides: {
        pixelScale: settings.pixelScale,
        screenFormat: settings.export.screenFormat,
        dpi: settings.dpi,
      },
      sourceCanvas,
    },
  ])
}

export async function downloadExports(jobs: ExportJob[]) {
  for (const job of jobs) {
    const settings = mergeExportOverrides(job.settings, job.overrides)
    const exportCanvas = await renderExportCanvas(settings, job.sourceCanvas)
    const exportDimensions = getExportDimensions(settings)
    const baseName = sanitizeFilename(job.pageName)
    const sizeLabel = `${exportDimensions.exportWidthPx}x${exportDimensions.exportHeightPx}`

    if (isScreenDocument(settings)) {
      const format = settings.export.screenFormat
      const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
      const dataUrl =
        format === "jpg"
          ? exportCanvas.toDataURL(mimeType, JPEG_QUALITY)
          : exportCanvas.toDataURL(mimeType)

      triggerDownload(dataUrl, `${baseName}-${sizeLabel}.${format}`)
      continue
    }

    if (isPrintDocument(settings)) {
      const pngData = exportCanvas.toDataURL("image/png")
      const widthMm = (exportDimensions.exportWidthPx / settings.dpi) * 25.4
      const heightMm = (exportDimensions.exportHeightPx / settings.dpi) * 25.4
      const orientation = widthMm >= heightMm ? "landscape" : "portrait"

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [widthMm, heightMm],
      })

      pdf.addImage(pngData, "PNG", 0, 0, widthMm, heightMm, undefined, "FAST")
      pdf.save(`${baseName}-${sizeLabel}.pdf`)
    }
  }
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = href
  link.click()
}
