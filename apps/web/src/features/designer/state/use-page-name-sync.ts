import { useEffect } from "react"

import type { CanvasPreset } from "@/features/designer/model/presets"
import type { FrameNameSource } from "@/features/designer/model/frames"
import type { CanvasSettings } from "@/features/designer/model/types"
import {
  findMatchingPreset,
  formatDimensionsLabel,
} from "@/features/designer/model/presets"

type UseFrameNameSyncArgs = {
  settings: CanvasSettings
  frameNameSource: FrameNameSource
  setFrameNameFromPreset: (preset: CanvasPreset) => void
  syncFrameNameFromSettings: (settings: CanvasSettings) => void
}

export function useFrameNameSync({
  settings,
  frameNameSource,
  setFrameNameFromPreset,
  syncFrameNameFromSettings,
}: UseFrameNameSyncArgs) {
  useEffect(() => {
    if (frameNameSource === "manual") {
      return
    }

    const matchingPreset = findMatchingPreset(
      settings.width,
      settings.height,
      settings.unit
    )

    if (matchingPreset) {
      setFrameNameFromPreset(matchingPreset)
      return
    }

    syncFrameNameFromSettings(settings)
  }, [
    frameNameSource,
    settings.width,
    settings.height,
    settings.unit,
    setFrameNameFromPreset,
    syncFrameNameFromSettings,
  ])
}

export function getSuggestedPageName(settings: CanvasSettings): string {
  const matchingPreset = findMatchingPreset(
    settings.width,
    settings.height,
    settings.unit
  )

  if (matchingPreset) {
    return matchingPreset.label
  }

  return formatDimensionsLabel(settings.width, settings.height, settings.unit)
}

/** @deprecated Use useFrameNameSync */
export const usePageNameSync = useFrameNameSync
