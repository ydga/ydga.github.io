import {
  getCropMarkLines,
  getCropMarkSpec,
} from "@/features/designer/lib/crop-marks"
import { isPrintDocument } from "@/features/designer/lib/document-intent"
import { getPreviewGuideGeometry } from "@/features/designer/lib/print-zones"
import type { CanvasSettings } from "@/features/designer/model/types"

type GuidesOverlayProps = {
  settings: CanvasSettings
  displayScale: number
}

export function GuidesOverlay({ settings, displayScale }: GuidesOverlayProps) {
  const { guides, print } = settings
  const showPrintGuides = isPrintDocument(settings)
  const geometry = getPreviewGuideGeometry(settings)
  const { trim, safe, bleedPx } = geometry

  const bleedDisplay = bleedPx * displayScale
  const trimDisplay = {
    x: trim.x * displayScale,
    y: trim.y * displayScale,
    width: trim.width * displayScale,
    height: trim.height * displayScale,
  }

  const safeDisplay = {
    x: safe.x * displayScale,
    y: safe.y * displayScale,
    width: safe.width * displayScale,
    height: safe.height * displayScale,
  }

  const overlayWidth = trimDisplay.width + bleedDisplay * 2
  const overlayHeight = trimDisplay.height + bleedDisplay * 2

  const trimGuide = {
    x: bleedDisplay,
    y: bleedDisplay,
    width: trimDisplay.width,
    height: trimDisplay.height,
  }

  const safeGuide = {
    x: bleedDisplay + safeDisplay.x,
    y: bleedDisplay + safeDisplay.y,
    width: safeDisplay.width,
    height: safeDisplay.height,
  }

  const centerX = trimGuide.x + trimGuide.width / 2
  const centerY = trimGuide.y + trimGuide.height / 2
  const showCropMarks = guides.showTrim && showPrintGuides
  const cropMarkSpec = showCropMarks ? getCropMarkSpec(settings, bleedPx) : null
  const cropMarkLines =
    cropMarkSpec === null
      ? []
      : getCropMarkLines(trimGuide, {
          gap: cropMarkSpec.gap * displayScale,
          length: cropMarkSpec.length * displayScale,
        })

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{
        left: -bleedDisplay,
        top: -bleedDisplay,
        width: overlayWidth,
        height: overlayHeight,
      }}
      viewBox={`0 0 ${overlayWidth} ${overlayHeight}`}
      aria-hidden
    >
      {guides.showBleed &&
      print.bleedEnabled &&
      showPrintGuides &&
      bleedPx > 0 ? (
        <rect
          x={0.5}
          y={0.5}
          width={Math.max(overlayWidth - 1, 0)}
          height={Math.max(overlayHeight - 1, 0)}
          fill="none"
          stroke="var(--color-destructive)"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      ) : null}

      {showCropMarks
        ? cropMarkLines.map((line, index) => (
            <line
              key={`crop-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="var(--color-foreground)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))
        : null}

      {guides.showSafe && print.safeEnabled && showPrintGuides ? (
        <rect
          x={safeGuide.x + 0.5}
          y={safeGuide.y + 0.5}
          width={Math.max(safeGuide.width - 1, 0)}
          height={Math.max(safeGuide.height - 1, 0)}
          fill="none"
          stroke="var(--color-primary)"
          strokeDasharray="6 4"
          strokeWidth={1}
        />
      ) : null}

      {guides.showCenter ? (
        <>
          <line
            x1={centerX}
            y1={trimGuide.y}
            x2={centerX}
            y2={trimGuide.y + trimGuide.height}
            stroke="#ff00ff"
            strokeDasharray="4 4"
            strokeWidth={1}
            opacity={0.85}
          />
          <line
            x1={trimGuide.x}
            y1={centerY}
            x2={trimGuide.x + trimGuide.width}
            y2={centerY}
            stroke="#ff00ff"
            strokeDasharray="4 4"
            strokeWidth={1}
            opacity={0.85}
          />
        </>
      ) : null}

      {guides.showThirds ? (
        <>
          {[1 / 3, 2 / 3].map((fraction) => (
            <line
              key={`v-${fraction}`}
              x1={trimGuide.x + trimGuide.width * fraction}
              y1={trimGuide.y}
              x2={trimGuide.x + trimGuide.width * fraction}
              y2={trimGuide.y + trimGuide.height}
              stroke="#06b6d4"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.85}
            />
          ))}
          {[1 / 3, 2 / 3].map((fraction) => (
            <line
              key={`h-${fraction}`}
              x1={trimGuide.x}
              y1={trimGuide.y + trimGuide.height * fraction}
              x2={trimGuide.x + trimGuide.width}
              y2={trimGuide.y + trimGuide.height * fraction}
              stroke="#06b6d4"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.85}
            />
          ))}
        </>
      ) : null}
    </svg>
  )
}
