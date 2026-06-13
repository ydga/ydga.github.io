export const VIEWPORT_FIT_MARGIN = 8

/** Name row (h-7) + gap above the canvas (gap-3). */
export const FRAME_NAME_CHROME_HEIGHT = 40

export type StageEdgeInsets = {
  top: number
  right: number
  bottom: number
  left: number
}

function getRequiredEdgeInsets(
  viewport: DOMRect,
  toolbar?: DOMRect | null,
  bottomChrome?: DOMRect | null
): StageEdgeInsets {
  let top = VIEWPORT_FIT_MARGIN
  let right = VIEWPORT_FIT_MARGIN
  let bottom = VIEWPORT_FIT_MARGIN
  const left = VIEWPORT_FIT_MARGIN

  if (toolbar) {
    right = Math.max(right, viewport.right - toolbar.left + VIEWPORT_FIT_MARGIN)
    top = Math.max(top, toolbar.bottom - viewport.top + VIEWPORT_FIT_MARGIN)
  }

  if (bottomChrome) {
    bottom = Math.max(
      bottom,
      viewport.bottom - bottomChrome.top + VIEWPORT_FIT_MARGIN
    )
  }

  return { top, right, bottom, left }
}

export function getStageEdgeInsets(
  viewport: DOMRect,
  toolbar?: DOMRect | null,
  bottomChrome?: DOMRect | null
): StageEdgeInsets {
  return getRequiredEdgeInsets(viewport, toolbar, bottomChrome)
}

/** Uniform inset on all sides — keeps the page centered while clearing stage chrome. */
export function getStageSafeAreaInset(
  viewport: DOMRect,
  toolbar?: DOMRect | null,
  bottomChrome?: DOMRect | null
) {
  const edges = getRequiredEdgeInsets(viewport, toolbar, bottomChrome)
  return Math.max(edges.top, edges.right, edges.bottom, edges.left)
}

/** Fit scale so the full frame (export size + name chrome) fits in the viewport. */
export function computeFitScale(
  contentWidthPx: number,
  contentHeightPx: number,
  viewport: DOMRect,
  edgeInsets: StageEdgeInsets
) {
  const availableWidth = Math.max(
    viewport.width - edgeInsets.left - edgeInsets.right,
    1
  )
  const availableHeight = Math.max(
    viewport.height - edgeInsets.top - edgeInsets.bottom,
    1
  )
  const canvasHeightBudget = Math.max(
    availableHeight - FRAME_NAME_CHROME_HEIGHT,
    1
  )

  const scaleByWidth = availableWidth / contentWidthPx
  const scaleByHeight = canvasHeightBudget / contentHeightPx

  return Math.min(scaleByWidth, scaleByHeight)
}
