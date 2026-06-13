"use client"

import { Maximize2 } from "lucide-react"

import {
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  type ZoomMode,
} from "@/features/designer/model/ui-types"
import { IconTileToggle } from "@workspace/ui/components/settings/icon-tile-toggle"
import { SettingControl } from "@workspace/ui/components/settings/setting-control"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import { Slider } from "@workspace/ui/components/slider"
import { cn } from "@workspace/ui/lib/utils"

const ZOOM_PRESETS = [50, 100, 200] as const

type ZoomControlsProps = {
  effectiveScale: number
  zoomMode: ZoomMode
  onZoomScaleChange: (scale: number) => void
  onZoomFit: () => void
  className?: string
}

export function ZoomControls({
  effectiveScale,
  zoomMode,
  onZoomScaleChange,
  onZoomFit,
  className,
}: ZoomControlsProps) {
  const percent = Math.round(effectiveScale * 100)
  const isPreset = ZOOM_PRESETS.includes(
    percent as (typeof ZOOM_PRESETS)[number]
  )

  return (
    <div
      className={cn("pointer-events-auto flex items-center gap-3", className)}
    >
      <Slider
        min={MIN_VIEWPORT_ZOOM}
        max={MAX_VIEWPORT_ZOOM}
        step={0.01}
        value={[effectiveScale]}
        aria-label="Zoom level"
        className="w-28 [&_[data-slot=slider-range]]:bg-foreground/35 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-foreground/20 [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-foreground/10"
        onValueChange={([value]) => {
          if (value !== undefined) {
            onZoomScaleChange(value)
          }
        }}
      />
      <SettingsSelect
        label="Z"
        labelTooltip="Zoom"
        value={isPreset ? String(percent) : "custom"}
        aria-label="Zoom percentage"
        wrapperClassName="w-[5.25rem]"
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10)
          if (next === 50 || next === 100 || next === 200) {
            onZoomScaleChange(next / 100)
          }
        }}
      >
        {!isPreset ? <option value="custom">{percent}%</option> : null}
        {ZOOM_PRESETS.map((preset) => (
          <option key={preset} value={String(preset)}>
            {preset}%
          </option>
        ))}
      </SettingsSelect>
      <SettingControl label="Fit">
        <IconTileToggle
          pressed={zoomMode === "fit"}
          aria-label="Fit"
          className="size-7 border-0 bg-transparent shadow-none hover:bg-muted/50"
          onPressedChange={(pressed) => {
            if (pressed) {
              onZoomFit()
              return
            }

            onZoomScaleChange(effectiveScale)
          }}
        >
          <Maximize2 className="size-3.5" />
        </IconTileToggle>
      </SettingControl>
    </div>
  )
}
