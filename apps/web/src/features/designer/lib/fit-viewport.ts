export const VIEWPORT_FIT_MARGIN = 8

type EdgeInsets = {
  top: number
  right: number
  bottom: number
  left: number
}

function getRequiredEdgeInsets(
  viewport: DOMRect,
  toolbar?: DOMRect | null,
  zoom?: DOMRect | null
): EdgeInsets {
  let top = VIEWPORT_FIT_MARGIN
  let right = VIEWPORT_FIT_MARGIN
  let bottom = VIEWPORT_FIT_MARGIN
  const left = VIEWPORT_FIT_MARGIN

  if (toolbar) {
    right = Math.max(right, viewport.right - toolbar.left + VIEWPORT_FIT_MARGIN)
    top = Math.max(top, toolbar.bottom - viewport.top + VIEWPORT_FIT_MARGIN)
  }

  if (zoom) {
    bottom = Math.max(bottom, viewport.bottom - zoom.top + VIEWPORT_FIT_MARGIN)
  }

  return { top, right, bottom, left }
}

/** Uniform inset on all sides — keeps the frame stack centered while clearing stage chrome. */
export function getStageSafeAreaInset(
  viewport: DOMRect,
  toolbar?: DOMRect | null,
  zoom?: DOMRect | null
) {
  const edges = getRequiredEdgeInsets(viewport, toolbar, zoom)
  return Math.max(edges.top, edges.right, edges.bottom, edges.left)
}

/** Fit scales to the available width using the widest frame; tall stacks scroll vertically. */
export function computeFitScale(
  exportWidthPx: number,
  viewportWidth: number,
  safeAreaInset: number
) {
  const availableWidth = Math.max(viewportWidth - safeAreaInset * 2, 1)

  return availableWidth / exportWidthPx
}
