import { useCallback, useEffect, useMemo, useState } from "react"

import { getDocumentIntent } from "@/features/designer/lib/document-intent"
import {
  createPageExportOverrides,
  type PageExportOverrides,
} from "@/features/designer/lib/export-settings"
import type { DesignerFrame } from "@/features/designer/model/frames"
import type {
  PixelScale,
  PrintDpi,
  ScreenExportFormat,
} from "@/features/designer/model/types"

export type PageExportEntry = {
  frameId: string
  selected: boolean
  overrides: PageExportOverrides
}

function createEntry(frame: DesignerFrame, selected: boolean): PageExportEntry {
  return {
    frameId: frame.id,
    selected,
    overrides: createPageExportOverrides(frame.settings),
  }
}

function syncOverridesForIntent(
  current: Record<string, PageExportEntry>,
  frames: DesignerFrame[],
  intent: ReturnType<typeof getDocumentIntent>,
  template: PageExportOverrides
): Record<string, PageExportEntry> {
  const next: Record<string, PageExportEntry> = { ...current }

  for (const frame of frames) {
    if (getDocumentIntent(frame.settings) !== intent) {
      continue
    }

    const row = next[frame.id]
    if (!row) {
      continue
    }

    next[frame.id] = {
      ...row,
      overrides: { ...template },
    }
  }

  return next
}

function applySyncTemplates(
  current: Record<string, PageExportEntry>,
  frames: DesignerFrame[]
): Record<string, PageExportEntry> {
  let next = { ...current }

  for (const intent of ["screen", "print"] as const) {
    const framesForIntent = frames.filter(
      (frame) => getDocumentIntent(frame.settings) === intent
    )

    if (framesForIntent.length < 2) {
      continue
    }

    let template: PageExportOverrides | undefined

    for (const frame of framesForIntent) {
      const entry = current[frame.id]
      if (entry?.selected) {
        template = entry.overrides
        break
      }
    }

    template ??= current[framesForIntent[0]?.id]?.overrides

    if (!template) {
      continue
    }

    next = syncOverridesForIntent(next, frames, intent, template)
  }

  return next
}

export function useExportSelection(
  frames: DesignerFrame[],
  activeFrameId: string
) {
  const [entries, setEntries] = useState<Record<string, PageExportEntry>>(() =>
    Object.fromEntries(
      frames.map((frame) => [
        frame.id,
        createEntry(frame, frame.id === activeFrameId),
      ])
    )
  )

  const [syncSettings, setSyncSettings] = useState(false)

  const frameIdsKey = frames.map((frame) => frame.id).join("|")

  useEffect(() => {
    setEntries((current) => {
      const next: Record<string, PageExportEntry> = {}

      for (const frame of frames) {
        next[frame.id] = current[frame.id] ?? createEntry(frame, false)
      }

      return next
    })
  }, [frameIdsKey])

  const setSelected = useCallback((frameId: string, selected: boolean) => {
    setEntries((current) => {
      const entry = current[frameId]
      if (!entry) {
        return current
      }

      return {
        ...current,
        [frameId]: { ...entry, selected },
      }
    })
  }, [])

  const updateOverride = useCallback(
    (frameId: string, patch: Partial<PageExportOverrides>) => {
      setEntries((current) => {
        const sourceFrame = frames.find((frame) => frame.id === frameId)
        const entry = current[frameId]
        if (!sourceFrame || !entry) {
          return current
        }

        const intent = getDocumentIntent(sourceFrame.settings)
        const nextOverrides = { ...entry.overrides, ...patch }

        if (syncSettings) {
          return syncOverridesForIntent(current, frames, intent, nextOverrides)
        }

        return {
          ...current,
          [frameId]: {
            ...entry,
            overrides: nextOverrides,
          },
        }
      })
    },
    [frames, syncSettings]
  )

  const setSyncSettingsEnabled = useCallback(
    (enabled: boolean) => {
      setSyncSettings(enabled)

      if (!enabled) {
        return
      }

      setEntries((current) => applySyncTemplates(current, frames))
    },
    [frames]
  )

  const setPixelScale = useCallback(
    (frameId: string, value: PixelScale) => {
      updateOverride(frameId, { pixelScale: value })
    },
    [updateOverride]
  )

  const setScreenFormat = useCallback(
    (frameId: string, value: ScreenExportFormat) => {
      updateOverride(frameId, { screenFormat: value })
    },
    [updateOverride]
  )

  const setDpi = useCallback(
    (frameId: string, value: PrintDpi) => {
      updateOverride(frameId, { dpi: value })
    },
    [updateOverride]
  )

  const selectAll = useCallback(() => {
    setEntries((current) => {
      const next: Record<string, PageExportEntry> = { ...current }

      for (const id of Object.keys(next)) {
        const row = next[id]
        if (!row) {
          continue
        }

        next[id] = { ...row, selected: true }
      }

      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setEntries((current) => {
      const next: Record<string, PageExportEntry> = { ...current }

      for (const id of Object.keys(next)) {
        const row = next[id]
        if (!row) {
          continue
        }

        next[id] = { ...row, selected: false }
      }

      return next
    })
  }, [])

  const orderedEntries = useMemo(
    () =>
      frames
        .map((frame) => entries[frame.id])
        .filter((entry): entry is PageExportEntry => entry != null),
    [frames, entries]
  )

  const selectedEntries = useMemo(
    () => orderedEntries.filter((entry) => entry.selected),
    [orderedEntries]
  )

  return {
    orderedEntries,
    selectedEntries,
    syncSettings,
    setSyncSettingsEnabled,
    selectAll,
    clearSelection,
    setSelected,
    setPixelScale,
    setScreenFormat,
    setDpi,
  }
}
