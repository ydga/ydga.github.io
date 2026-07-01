"use client"

import { useCallback } from "react"

import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import { FillBackgroundField } from "@/features/designer/components/settings/fill-background-field"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  panelSectionClassName,
  settingsControlHeightClassName,
  settingsControlLineHeightClassName,
  settingsInlineLabelAddonClassName,
  settingsInlineLabelClassName,
  settingsInputGroupClasses,
  settingsNumberFieldClassName,
  settingsNumericTextClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import { useScrubNumber } from "@workspace/ui/components/settings/use-scrub-number"
import { cn } from "@workspace/ui/lib/utils"

import type {
  ImageLayer,
  ImageLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import {
  resolveImageLayerFill,
  resolveImageLayerOpacity,
} from "@/features/designer/model/image-layer-style"

type ImageLayerSettingsPanelProps = {
  layer: ImageLayer
  trimWidthPx: number
  trimHeightPx: number
  onUpdate: (patch: ImageLayerUpdatePatch) => void
  onImageUpload: (file: File | null) => void
}

type OpacityPercentFieldProps = {
  value: number
  onChange: (value: number) => void
  className?: string
}

function OpacityPercentField({
  value,
  onChange,
  className,
}: OpacityPercentFieldProps) {
  const onOpacityScrub = useCallback(
    (next: number) => onChange(Math.min(100, Math.max(0, Math.round(next)))),
    [onChange]
  )

  const { isScrubbing, scrubHandlers } = useScrubNumber({
    value,
    onChange: onOpacityScrub,
    min: 0,
    max: 100,
    step: 1,
  })

  return (
    <InputGroup
      className={cn(
        settingsInputGroupClasses(
          cn(
            settingsControlHeightClassName,
            "w-16 shrink-0 cursor-ew-resize",
            className
          )
        ),
        isScrubbing && "select-none"
      )}
      {...scrubHandlers}
    >
      <InputGroupAddon
        align="inline-start"
        className={cn(settingsInlineLabelAddonClassName, "cursor-ew-resize")}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                settingsInlineLabelClassName,
                "cursor-ew-resize select-none"
              )}
            >
              %
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Opacity</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Opacity"
        className={cn(
          settingsNumberFieldClassName,
          settingsControlHeightClassName,
          settingsControlLineHeightClassName,
          settingsNumericTextClassName,
          "min-w-0 py-0 pr-2 pl-0 text-right"
        )}
        onChange={(event) => {
          const parsed = Number.parseFloat(event.target.value)
          if (!Number.isNaN(parsed)) {
            onChange(Math.min(100, Math.max(0, Math.round(parsed))))
          }
        }}
      />
    </InputGroup>
  )
}

export function ImageLayerSettingsPanel({
  layer,
  trimWidthPx,
  trimHeightPx,
  onUpdate,
  onImageUpload,
}: ImageLayerSettingsPanelProps) {
  const fill = resolveImageLayerFill(layer)
  const opacity = Math.round(resolveImageLayerOpacity(layer) * 100)

  const applyFillAction = useCallback(
    (action: Parameters<typeof backgroundSettingsReducer>[1]) => {
      onUpdate({
        fill: backgroundSettingsReducer(fill, action),
      })
    },
    [fill, onUpdate]
  )

  return (
    <div className={panelSectionClassName}>
      <SettingSection title="Dimensions">
        <DimensionField
          label={null}
          width={Math.round(layer.width)}
          height={Math.round(layer.height)}
          minWidth={1}
          minHeight={1}
          maxWidth={trimWidthPx}
          maxHeight={trimHeightPx}
          step={1}
          onWidthChange={(value) =>
            onUpdate({
              width: Math.min(trimWidthPx, Math.max(1, Math.round(value))),
            })
          }
          onHeightChange={(value) =>
            onUpdate({
              height: Math.min(trimHeightPx, Math.max(1, Math.round(value))),
            })
          }
        />
      </SettingSection>

      <SettingSection title="Appearance">
        <div className="flex w-full min-w-0 gap-2">
          <FillBackgroundField
            className="min-w-0 flex-1"
            background={fill}
            swatchAriaLabel="Edit image"
            transparentHelpText="No image on export."
            onAction={applyFillAction}
            onImageUpload={onImageUpload}
          />
          <OpacityPercentField
            value={opacity}
            onChange={(next) => onUpdate({ opacity: next })}
          />
        </div>
      </SettingSection>
    </div>
  )
}
