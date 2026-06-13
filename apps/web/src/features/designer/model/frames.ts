import { DEFAULT_CANVAS_SETTINGS } from "@/features/designer/model/defaults"
import { findMatchingPreset } from "@/features/designer/model/presets"
import type { Layer } from "@/features/designer/model/layers"
import type { CanvasSettings } from "@/features/designer/model/types"

export type FrameNameSource = "auto" | "manual"

export const DEFAULT_PAGE_NAME = "Untitled"

export type DesignerFrame = {
  id: string
  name: string
  nameSource: FrameNameSource
  settings: CanvasSettings
}

export const DEFAULT_FRAME_ID = "frame-1"

function getInitialFrameName() {
  const { width, height, unit } = DEFAULT_CANVAS_SETTINGS
  return findMatchingPreset(width, height, unit)?.label ?? DEFAULT_PAGE_NAME
}

export function createInitialFrame(): DesignerFrame {
  return {
    id: DEFAULT_FRAME_ID,
    name: getInitialFrameName(),
    nameSource: "auto",
    settings: structuredClone(DEFAULT_CANVAS_SETTINGS),
  }
}

export function createFrameFromSource(
  source: DesignerFrame,
  id: string,
  name: string
): DesignerFrame {
  return {
    id,
    name,
    nameSource: "auto",
    settings: structuredClone(source.settings),
  }
}

export function frameHasElements(frame: DesignerFrame, layers: Layer[]) {
  if (layers.some((layer) => layer.frameId === frame.id)) {
    return true
  }

  return frame.settings.background.imageSrc !== null
}

export function moveFrame(
  frames: DesignerFrame[],
  frameId: string,
  direction: "up" | "down"
) {
  const index = frames.findIndex((frame) => frame.id === frameId)
  if (index === -1) {
    return frames
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= frames.length) {
    return frames
  }

  const next = [...frames]
  const [moved] = next.splice(index, 1)
  next.splice(targetIndex, 0, moved!)
  return next
}

export function getDuplicateFrameName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    return "Untitled copy"
  }

  return `${trimmed} copy`
}

/** Keep a valid page selected whenever the frame list changes. */
export function resolveActiveFrameId(
  frames: DesignerFrame[],
  activeFrameId: string
): string {
  if (frames.length === 0) {
    return DEFAULT_FRAME_ID
  }

  return frames.some((frame) => frame.id === activeFrameId)
    ? activeFrameId
    : frames[0].id
}
