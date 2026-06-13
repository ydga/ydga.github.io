import { useEffect } from "react"

import {
  findMatchingPreset,
  formatDimensionsLabel,
  type CanvasPreset,
} from "@/features/designer/model/presets"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { PageNameSource } from "@/features/designer/state/use-designer-ui"

type UsePageNameSyncArgs = {
  settings: CanvasSettings
  pageNameSource: PageNameSource
  setPageNameFromPreset: (preset: CanvasPreset) => void
  syncPageNameFromSettings: (settings: CanvasSettings) => void
}

export function usePageNameSync({
  settings,
  pageNameSource,
  setPageNameFromPreset,
  syncPageNameFromSettings,
}: UsePageNameSyncArgs) {
  useEffect(() => {
    if (pageNameSource === "manual") {
      return
    }

    const matchingPreset = findMatchingPreset(
      settings.width,
      settings.height,
      settings.unit
    )

    if (matchingPreset) {
      setPageNameFromPreset(matchingPreset)
      return
    }

    syncPageNameFromSettings(settings)
  }, [
    pageNameSource,
    settings.width,
    settings.height,
    settings.unit,
    setPageNameFromPreset,
    syncPageNameFromSettings,
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
