"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { settingsColorSwatchTriggerClassName } from "@workspace/ui/components/settings/settings-field-styles"
import {
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

const RECENT_COLORS_KEY = "color-picker-recent-colors"
const RECENT_COLORS_MAX = 8

function loadRecentColors(): string[] {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(RECENT_COLORS_KEY)
        : null
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c): c is string => typeof c === "string")
  } catch {
    return []
  }
}

function saveRecentColors(colors: string[]): void {
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors))
  } catch {}
}

function addToRecent(colors: string[], color: string): string[] {
  const hex = normalizeHexColor(color)
  const filtered = colors.filter((c) => c.toLowerCase() !== hex.toLowerCase())
  return [hex, ...filtered].slice(0, RECENT_COLORS_MAX)
}

type ColorPickerPanelProps = {
  value: string
  onChange: (value: string) => void
  recentColors?: string[]
  onRecentColorClick?: (color: string) => void
  className?: string
}

export function ColorPickerPanel({
  value,
  onChange,
  recentColors,
  onRecentColorClick,
  className,
}: ColorPickerPanelProps) {
  const normalizedValue = normalizeHexColor(value)
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(normalizedValue))
  const planeRef = useRef<HTMLDivElement>(null)
  const hsvRef = useRef(hsv)

  useEffect(() => {
    setHsv(hexToHsv(normalizeHexColor(value)))
  }, [value])

  useEffect(() => {
    hsvRef.current = hsv
  }, [hsv])

  const commitHsv = useCallback(
    (next: HsvColor) => {
      setHsv(next)
      onChange(hsvToHex(next.h, next.s, next.v))
    },
    [onChange]
  )

  const updateFromPlane = useCallback(
    (clientX: number, clientY: number) => {
      const plane = planeRef.current
      if (!plane) {
        return
      }

      const rect = plane.getBoundingClientRect()
      const saturation = clamp(
        ((clientX - rect.left) / rect.width) * 100,
        0,
        100
      )
      const brightness = clamp(
        100 - ((clientY - rect.top) / rect.height) * 100,
        0,
        100
      )

      commitHsv({
        ...hsvRef.current,
        s: saturation,
        v: brightness,
      })
    },
    [commitHsv]
  )

  const startPlaneDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    updateFromPlane(event.clientX, event.clientY)

    const pointerId = event.pointerId
    event.currentTarget.setPointerCapture(pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      updateFromPlane(moveEvent.clientX, moveEvent.clientY)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return
      }

      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  const hasRecent = recentColors && recentColors.length > 0

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="aspect-square w-full">
        <div className="flex size-full flex-col gap-1.5 pb-1.5">
          <div
            ref={planeRef}
            className="relative min-h-0 flex-1 cursor-crosshair touch-none overflow-hidden rounded-lg select-none"
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
            }}
            onPointerDown={startPlaneDrag}
          >
            <span
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: hsvToHex(hsv.h, hsv.s, hsv.v),
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={Math.round(hsv.h)}
            aria-label="Hue"
            className="h-3 w-full shrink-0 cursor-pointer appearance-none rounded-none bg-transparent px-1.5 [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
            onChange={(event) => {
              const hue = Number.parseFloat(event.target.value)
              if (!Number.isNaN(hue)) {
                commitHsv({ ...hsv, h: hue })
              }
            }}
          />
        </div>
      </div>

      {hasRecent && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {recentColors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use recent color ${color}`}
              title={color}
              className="size-4 shrink-0 cursor-pointer rounded-full border border-black/10 shadow-sm ring-offset-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/10"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color)
                onRecentColorClick?.(color)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type ColorPickerFieldProps = {
  value: string
  onChange: (value: string) => void
  showHexInput?: boolean
  swatchLabel?: string
  hexLabel?: string
  className?: string
  swatchClassName?: string
  onOpenChange?: (open: boolean) => void
  triggerVariant?: "swatch" | "line"
  /** Preview thickness for `triggerVariant="line"` (trim-space px). */
  lineWidth?: number
}

export function ColorPickerField({
  value,
  onChange,
  showHexInput = true,
  swatchLabel = "Color",
  hexLabel = "Color hex",
  className,
  swatchClassName,
  onOpenChange,
  triggerVariant = "swatch",
  lineWidth = 2,
}: ColorPickerFieldProps) {
  const normalizedValue = normalizeHexColor(value)
  const [recentColors, setRecentColors] = useState<string[]>(loadRecentColors)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const next = addToRecent(recentColors, normalizedValue)
      setRecentColors(next)
      saveRecentColors(next)
    }
    onOpenChange?.(open)
  }

  const handleRecentColorClick = (color: string) => {
    const next = addToRecent(recentColors, color)
    setRecentColors(next)
    saveRecentColors(next)
  }

  const previewLineHeight = Math.max(1, Math.min(lineWidth, 6))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover modal={false} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={swatchLabel}
            className={cn(
              settingsColorSwatchTriggerClassName,
              triggerVariant === "line" &&
                "flex items-center justify-center px-1",
              swatchClassName
            )}
          >
            {triggerVariant === "line" ? (
              <span
                aria-hidden
                className="block w-full"
                style={{
                  height: previewLineHeight,
                  backgroundColor: normalizedValue,
                }}
              />
            ) : (
              <span
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: normalizedValue }}
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="left"
          sideOffset={8}
          className="w-44 gap-0 rounded-3xl p-2.5"
        >
          <ColorPickerPanel
            value={normalizedValue}
            onChange={onChange}
            recentColors={recentColors}
            onRecentColorClick={handleRecentColorClick}
          />
        </PopoverContent>
      </Popover>

      {showHexInput ? (
        <SettingsInput
          type="text"
          value={normalizedValue}
          aria-label={hexLabel}
          className="h-7 min-w-0 flex-1 font-mono tabular-nums"
          onChange={(event) => onChange(normalizeHexColor(event.target.value))}
        />
      ) : null}
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
