"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { settingsFieldClasses } from "@workspace/ui/components/settings/settings-field-styles"
import {
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

type ColorPickerPanelProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ColorPickerPanel({
  value,
  onChange,
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

  return (
    <div className={cn("aspect-square w-full", className)}>
      <div className="flex size-full flex-col overflow-hidden rounded-lg border border-border/60">
        <div
          ref={planeRef}
          className="relative min-h-0 flex-1 cursor-crosshair touch-none select-none"
          style={{
            backgroundColor: `hsl(${hsv.h} 100% 50%)`,
            backgroundImage:
              "linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
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
          className="h-3 w-full shrink-0 cursor-pointer appearance-none rounded-none bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
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
}: ColorPickerFieldProps) {
  const normalizedValue = normalizeHexColor(value)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover modal={false} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={swatchLabel}
            className={cn(
              settingsFieldClasses(
                "size-7 shrink-0 cursor-pointer rounded-md border border-border/60 p-0.5"
              ),
              swatchClassName
            )}
          >
            <span
              className="block size-full rounded-[4px]"
              style={{ backgroundColor: normalizedValue }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="left"
          sideOffset={8}
          className="aspect-square w-44 gap-0 rounded-3xl p-2.5"
        >
          <ColorPickerPanel value={normalizedValue} onChange={onChange} />
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
