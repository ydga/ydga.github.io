import type { ActiveSnapGuideLines } from "@/features/designer/lib/guide-snap"

type SmartGuidesOverlayProps = {
  guides: ActiveSnapGuideLines | null
  displayScale: number
  trimWidthPx: number
  trimHeightPx: number
  bleedDisplay?: number
}

export function SmartGuidesOverlay({
  guides,
  displayScale,
  trimWidthPx,
  trimHeightPx,
  bleedDisplay = 0,
}: SmartGuidesOverlayProps) {
  if (!guides || (guides.xs.length === 0 && guides.ys.length === 0)) {
    return null
  }

  const overlayWidth = trimWidthPx * displayScale + bleedDisplay * 2
  const overlayHeight = trimHeightPx * displayScale + bleedDisplay * 2

  return (
    <svg
      className="pointer-events-none absolute z-[26] overflow-visible"
      style={{
        left: -bleedDisplay,
        top: -bleedDisplay,
        width: overlayWidth,
        height: overlayHeight,
      }}
      viewBox={`0 0 ${overlayWidth} ${overlayHeight}`}
      aria-hidden
    >
      {guides.xs.map((x) => {
        const displayX = bleedDisplay + x * displayScale
        return (
          <line
            key={`smart-v-${x}`}
            x1={displayX}
            y1={bleedDisplay}
            x2={displayX}
            y2={bleedDisplay + trimHeightPx * displayScale}
            stroke="#ff00ff"
            strokeWidth={1}
            opacity={0.9}
          />
        )
      })}
      {guides.ys.map((y) => {
        const displayY = bleedDisplay + y * displayScale
        return (
          <line
            key={`smart-h-${y}`}
            x1={bleedDisplay}
            y1={displayY}
            x2={bleedDisplay + trimWidthPx * displayScale}
            y2={displayY}
            stroke="#ff00ff"
            strokeWidth={1}
            opacity={0.9}
          />
        )
      })}
    </svg>
  )
}
