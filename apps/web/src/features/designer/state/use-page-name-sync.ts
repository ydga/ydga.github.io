import { useEffect } from "react"

import type { CanvasPreset } from "@/features/designer/model/presets"
import { findMatchingPreset } from "@/features/designer/model/presets"
import {
  DEFAULT_PAGE_NAME,
  type FrameNameSource,
} from "@/features/designer/model/frames"
import type { CanvasSettings } from "@/features/designer/model/types"

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

  return DEFAULT_PAGE_NAME
}

/** @deprecated Use useFrameNameSync */
export const usePageNameSync = useFrameNameSync
