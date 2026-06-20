import { useCallback, useMemo, useRef, useState } from "react"

import {
  computeFrameRemoval,
  createFrameFromSource,
  createInitialFrame,
  DEFAULT_FRAME_ID,
  moveFrame as moveFrameList,
  getDuplicateFrameName,
  resolveActiveFrameId,
  type DesignerFrame,
  type FrameNameSource,
} from "@/features/designer/model/frames"
import type { CanvasPreset } from "@/features/designer/model/presets"
import type { CanvasSettings } from "@/features/designer/model/types"
import { getSuggestedPageName } from "@/features/designer/state/use-page-name-sync"
import {
  designerReducer,
  type DesignerAction,
} from "@/features/designer/state/use-designer-settings"

export function useDesignerFrames() {
  const [frames, setFrames] = useState<DesignerFrame[]>(() => [
    createInitialFrame(),
  ])
  const [activeFrameId, setActiveFrameId] = useState(DEFAULT_FRAME_ID)
  const imageUrlRefs = useRef<Map<string, string>>(new Map())

  const resolvedActiveFrameId = useMemo(
    () => resolveActiveFrameId(frames, activeFrameId),
    [frames, activeFrameId]
  )

  const activeFrame =
    frames.find((frame) => frame.id === resolvedActiveFrameId) ?? frames[0]!

  const dispatch = useCallback(
    (action: DesignerAction) => {
      setFrames((current) =>
        current.map((frame) =>
          frame.id === resolvedActiveFrameId
            ? { ...frame, settings: designerReducer(frame.settings, action) }
            : frame
        )
      )
    },
    [resolvedActiveFrameId]
  )

  const setFrameName = useCallback(
    (name: string) => {
      setFrames((current) =>
        current.map((frame) =>
          frame.id === resolvedActiveFrameId
            ? { ...frame, name, nameSource: "manual" as FrameNameSource }
            : frame
        )
      )
    },
    [resolvedActiveFrameId]
  )

  const setFrameNameForFrame = useCallback((frameId: string, name: string) => {
    setFrames((current) =>
      current.map((frame) =>
        frame.id === frameId
          ? { ...frame, name, nameSource: "manual" as FrameNameSource }
          : frame
      )
    )
  }, [])

  const setFrameNameFromPreset = useCallback(
    (preset: CanvasPreset) => {
      setFrames((current) =>
        current.map((frame) =>
          frame.id === resolvedActiveFrameId
            ? { ...frame, name: preset.label, nameSource: "auto" }
            : frame
        )
      )
    },
    [resolvedActiveFrameId]
  )

  const syncFrameNameFromSettings = useCallback(
    (settings: CanvasSettings) => {
      setFrames((current) =>
        current.map((frame) =>
          frame.id === resolvedActiveFrameId
            ? {
                ...frame,
                name: getSuggestedPageName(settings),
                nameSource: "auto",
              }
            : frame
        )
      )
    },
    [resolvedActiveFrameId]
  )

  const selectFrame = useCallback(
    (frameId: string) => {
      setActiveFrameId(resolveActiveFrameId(frames, frameId))
    },
    [frames]
  )

  const addFrame = useCallback(() => {
    const newFrameId = crypto.randomUUID()
    setFrames((current) => {
      const source =
        current.find((frame) => frame.id === resolvedActiveFrameId) ??
        current[0]!
      return [
        ...current,
        createFrameFromSource(source, newFrameId, `Page ${current.length + 1}`),
      ]
    })
    setActiveFrameId(newFrameId)
    return newFrameId
  }, [resolvedActiveFrameId])

  const removeFrame = useCallback(
    (frameId: string) => {
      const existingUrl = imageUrlRefs.current.get(frameId)
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl)
        imageUrlRefs.current.delete(frameId)
      }

      let nextActiveId = activeFrameId

      setFrames((current) => {
        const result = computeFrameRemoval(current, frameId, activeFrameId)
        if (!result) {
          return current
        }

        nextActiveId = result.nextActiveId
        return result.nextFrames
      })

      setActiveFrameId(nextActiveId)
      return nextActiveId
    },
    [activeFrameId]
  )

  const moveFrame = useCallback((frameId: string, direction: "up" | "down") => {
    setFrames((current) => moveFrameList(current, frameId, direction))
  }, [])

  const duplicateFrame = useCallback((frameId: string) => {
    const newFrameId = crypto.randomUUID()

    setFrames((current) => {
      const index = current.findIndex((frame) => frame.id === frameId)
      if (index === -1) {
        return current
      }

      const source = current[index]!
      const imageSrc = source.settings.background.imageSrc

      if (imageSrc && imageUrlRefs.current.has(frameId)) {
        imageUrlRefs.current.set(newFrameId, imageSrc)
      }

      const duplicate = {
        ...createFrameFromSource(
          source,
          newFrameId,
          getDuplicateFrameName(source.name)
        ),
        nameSource: "manual" as FrameNameSource,
      }

      const next = [...current]
      next.splice(index + 1, 0, duplicate)
      return next
    })

    setActiveFrameId(newFrameId)
    return newFrameId
  }, [])

  const setBackgroundImage = useCallback(
    (file: File | null) => {
      const existingUrl = imageUrlRefs.current.get(resolvedActiveFrameId)
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl)
        imageUrlRefs.current.delete(resolvedActiveFrameId)
      }

      if (!file) {
        dispatch({ type: "set-background-image", value: null })
        return
      }

      const objectUrl = URL.createObjectURL(file)
      imageUrlRefs.current.set(resolvedActiveFrameId, objectUrl)
      dispatch({
        type: "set-background-image",
        value: objectUrl,
      })
    },
    [resolvedActiveFrameId, dispatch]
  )

  return {
    frames,
    activeFrameId: resolvedActiveFrameId,
    activeFrame,
    settings: activeFrame.settings,
    frameName: activeFrame.name,
    frameNameSource: activeFrame.nameSource,
    dispatch,
    selectFrame,
    addFrame,
    removeFrame,
    moveFrame,
    duplicateFrame,
    setFrameName,
    setFrameNameForFrame,
    setFrameNameFromPreset,
    syncFrameNameFromSettings,
    setBackgroundImage,
  }
}

export type DesignerFrames = ReturnType<typeof useDesignerFrames>
