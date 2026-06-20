import { useCallback } from "react"

import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import { FillBackgroundField } from "@/features/designer/components/settings/fill-background-field"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
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
import { normalizeHexColor } from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

import type {
  ShapeLayer,
  ShapeLayerUpdatePatch,
} from "@/features/designer/model/layers"
import { backgroundSettingsReducer } from "@/features/designer/lib/background-settings-reducer"
import {
  DEFAULT_SHAPE_STROKE,
  resolveShapeLayerFillBackground,
  resolveShapeLayerOpacity,
  resolveShapeLayerStroke,
  resolveShapeLayerStrokeWidth,
} from "@/features/designer/model/shape-layer-style"

type ShapeLayerSettingsPanelProps = {
  layer: ShapeLayer
  trimWidthPx: number
  trimHeightPx: number
  onUpdate: (patch: ShapeLayerUpdatePatch) => void
  onFillImageUpload: (file: File | null) => void
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

type StrokeWidthFieldProps = {
  value: number
  onChange: (value: number) => void
}

function StrokeWidthField({ value, onChange }: StrokeWidthFieldProps) {
  const onStrokeWidthScrub = useCallback(
    (next: number) => onChange(Math.min(48, Math.max(1, Math.round(next)))),
    [onChange]
  )

  const { isScrubbing, scrubHandlers } = useScrubNumber({
    value,
    onChange: onStrokeWidthScrub,
    min: 1,
    max: 48,
    step: 1,
  })

  return (
    <InputGroup
      className={cn(
        settingsInputGroupClasses(
          cn(settingsControlHeightClassName, "w-16 shrink-0 cursor-ew-resize")
        ),
        isScrubbing && "select-none"
      )}
      {...scrubHandlers}
    >
      <InputGroupInput
        type="number"
        aria-label="Stroke width"
        min={1}
        max={48}
        step={1}
        value={value}
        className={cn(
          settingsNumberFieldClassName,
          settingsControlHeightClassName,
          settingsControlLineHeightClassName,
          settingsNumericTextClassName,
          "min-w-0 py-0 pr-2 pl-2 text-right"
        )}
        onChange={(event) => {
          const parsed = Number.parseFloat(event.target.value)
          if (!Number.isNaN(parsed)) {
            onChange(Math.min(48, Math.max(1, Math.round(parsed))))
          }
        }}
      />
    </InputGroup>
  )
}

export function ShapeLayerSettingsPanel({
  layer,
  trimWidthPx,
  trimHeightPx,
  onUpdate,
  onFillImageUpload,
}: ShapeLayerSettingsPanelProps) {
  const isLine = layer.shapeType === "line"
  const fill = resolveShapeLayerFillBackground(layer)
  const stroke = resolveShapeLayerStroke(layer)
  const strokeWidth = resolveShapeLayerStrokeWidth(layer)
  const opacity = Math.round(resolveShapeLayerOpacity(layer) * 100)

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
        <div className="flex flex-col gap-3">
          {!isLine ? (
            <div className="flex w-full min-w-0 gap-2">
              <FillBackgroundField
                className="min-w-0 flex-1"
                background={fill}
                swatchAriaLabel="Edit shape fill"
                transparentHelpText="No fill on export."
                onAction={applyFillAction}
                onImageUpload={onFillImageUpload}
              />
              <OpacityPercentField
                value={opacity}
                onChange={(next) => onUpdate({ opacity: next })}
              />
            </div>
          ) : null}

          <div className="flex w-full min-w-0 gap-2">
            <ColorPickerField
              className="min-w-0 flex-1"
              triggerVariant="line"
              lineWidth={strokeWidth}
              value={stroke === "transparent" ? DEFAULT_SHAPE_STROKE : stroke}
              swatchLabel={isLine ? "Stroke color" : "Stroke"}
              hexLabel="Stroke color hex"
              onChange={(value) =>
                onUpdate({
                  stroke: normalizeHexColor(value) ?? DEFAULT_SHAPE_STROKE,
                })
              }
            />
            <StrokeWidthField
              value={strokeWidth}
              onChange={(next) => onUpdate({ strokeWidth: next })}
            />
            {isLine ? (
              <OpacityPercentField
                value={opacity}
                onChange={(next) => onUpdate({ opacity: next })}
              />
            ) : null}
          </div>
        </div>
      </SettingSection>
    </div>
  )
}
