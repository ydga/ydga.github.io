import type { CanvasSettings } from "@/features/designer/model/types"
import { getGuideGeometry } from "@/features/designer/lib/print-zones"

type GuidesOverlayProps = {
  settings: CanvasSettings
  displayWidth: number
  displayHeight: number
}

export function GuidesOverlay({
  settings,
  displayWidth,
  displayHeight,
}: GuidesOverlayProps) {
  const { guides, print, unit } = settings
  const geometry = getGuideGeometry(settings)
  const scaleX = displayWidth / geometry.exportWidthPx
  const scaleY = displayHeight / geometry.exportHeightPx

  function toDisplay(value: number) {
    return value * scaleX
  }

  function toDisplayY(value: number) {
    return value * scaleY
  }

  const trim = {
    x: toDisplay(geometry.trim.x),
    y: toDisplayY(geometry.trim.y),
    width: geometry.trim.width * scaleX,
    height: geometry.trim.height * scaleY,
  }

  const safe = {
    x: toDisplay(geometry.safe.x),
    y: toDisplayY(geometry.safe.y),
    width: geometry.safe.width * scaleX,
    height: geometry.safe.height * scaleY,
  }

  const centerX = trim.x + trim.width / 2
  const centerY = trim.y + trim.height / 2

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={displayWidth}
      height={displayHeight}
      viewBox={`0 0 ${displayWidth} ${displayHeight}`}
      aria-hidden
    >
      {guides.showBleed && print.bleedEnabled && unit === "cm" ? (
        <rect
          x={0.5}
          y={0.5}
          width={displayWidth - 1}
          height={displayHeight - 1}
          fill="none"
          stroke="var(--color-destructive)"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      ) : null}

      {guides.showTrim ? (
        <rect
          x={trim.x + 0.5}
          y={trim.y + 0.5}
          width={Math.max(trim.width - 1, 0)}
          height={Math.max(trim.height - 1, 0)}
          fill="none"
          stroke="var(--color-foreground)"
          strokeWidth={1}
        />
      ) : null}

      {guides.showSafe && print.safeEnabled && unit === "cm" ? (
        <rect
          x={safe.x + 0.5}
          y={safe.y + 0.5}
          width={Math.max(safe.width - 1, 0)}
          height={Math.max(safe.height - 1, 0)}
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
            y1={trim.y}
            x2={centerX}
            y2={trim.y + trim.height}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1}
            opacity={0.7}
          />
          <line
            x1={trim.x}
            y1={centerY}
            x2={trim.x + trim.width}
            y2={centerY}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1}
            opacity={0.7}
          />
        </>
      ) : null}

      {guides.showThirds ? (
        <>
          {[1 / 3, 2 / 3].map((fraction) => (
            <line
              key={`v-${fraction}`}
              x1={trim.x + trim.width * fraction}
              y1={trim.y}
              x2={trim.x + trim.width * fraction}
              y2={trim.y + trim.height}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
          {[1 / 3, 2 / 3].map((fraction) => (
            <line
              key={`h-${fraction}`}
              x1={trim.x}
              y1={trim.y + trim.height * fraction}
              x2={trim.x + trim.width}
              y2={trim.y + trim.height * fraction}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
        </>
      ) : null}
    </svg>
  )
}
