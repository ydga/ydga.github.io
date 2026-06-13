import { useCallback, useEffect, useMemo, useState } from "react"

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
        const entry = current[frameId]
        if (!entry) {
          return current
        }

        if (syncSettings) {
          const next: Record<string, PageExportEntry> = { ...current }

          for (const id of Object.keys(next)) {
            const row = next[id]
            if (!row) {
              continue
            }

            next[id] = {
              ...row,
              overrides: { ...row.overrides, ...patch },
            }
          }

          return next
        }

        return {
          ...current,
          [frameId]: {
            ...entry,
            overrides: { ...entry.overrides, ...patch },
          },
        }
      })
    },
    [syncSettings]
  )

  const setSyncSettingsEnabled = useCallback(
    (enabled: boolean) => {
      setSyncSettings(enabled)

      if (!enabled) {
        return
      }

      setEntries((current) => {
        let sourceEntry: PageExportEntry | undefined

        for (const frame of frames) {
          const entry = current[frame.id]
          if (entry?.selected) {
            sourceEntry = entry
            break
          }
        }

        sourceEntry ??= current[frames[0]?.id]

        if (!sourceEntry) {
          return current
        }

        const template = sourceEntry.overrides
        const next: Record<string, PageExportEntry> = { ...current }

        for (const id of Object.keys(next)) {
          const row = next[id]
          if (!row) {
            continue
          }

          next[id] = {
            ...row,
            overrides: { ...template },
          }
        }

        return next
      })
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
