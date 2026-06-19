import { useCallback } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Shrink,
  Square,
  Strikethrough,
  Underline,
} from "lucide-react"

import type {
  TextLayer,
  TextLayerLineHeightUnit,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  MAX_TEXT_LINE_HEIGHT_EM,
  MAX_TEXT_LINE_HEIGHT_PX,
  MIN_TEXT_LINE_HEIGHT_EM,
  MIN_TEXT_LINE_HEIGHT_PX,
  TEXT_LAYER_FONT_WEIGHT_PRESETS,
  resolveTextLayerClip,
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerFontWeight,
  resolveTextLayerLineHeightUnit,
  resolveTextLayerLineHeightValue,
  resolveTextLayerSizing,
  resolveTextLayerTextAlign,
  resolveTextLayerVerticalAlign,
} from "@/features/designer/model/text-layer-style"
import { autoLineHeightApproxTrimPx } from "@/features/designer/lib/text-layer-layout"
import { TextLayerFontFamilyPicker } from "@/features/designer/components/settings/text-layer-font-family-picker"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import {
  InputGroup,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import {
  panelSectionClassName,
  settingsControlHeightClassName,
  settingsControlLineHeightClassName,
  settingsInputGroupClasses,
  settingsLabelClassName,
  settingsNumberFieldClassName,
  settingsNumericTextClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import { useScrubNumber } from "@workspace/ui/components/settings/use-scrub-number"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { normalizeHexColor } from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36

type TextLayerSettingsPanelProps = {
  layer: TextLayer
  trimWidthPx: number
  trimHeightPx: number
  onUpdate: (patch: TextLayerUpdatePatch) => void
}

function clampFontSizePx(value: number) {
  return Math.min(240, Math.max(8, Math.round(value)))
}

function clampLineHeightForUnit(unit: TextLayerLineHeightUnit, value: number) {
  if (unit === "auto") {
    return value
  }
  const rounded = Math.round(value * 100) / 100
  if (unit === "px") {
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_PX,
      Math.max(MIN_TEXT_LINE_HEIGHT_PX, Math.round(value))
    )
  }
  return Math.min(
    MAX_TEXT_LINE_HEIGHT_EM,
    Math.max(MIN_TEXT_LINE_HEIGHT_EM, rounded)
  )
}

function isTextLayerLineHeightUnit(
  value: string
): value is TextLayerLineHeightUnit {
  return value === "px" || value === "em" || value === "auto"
}

function lineHeightTrimPxForConversion(layer: TextLayer): number {
  const u = resolveTextLayerLineHeightUnit(layer)
  if (u === "auto") {
    return autoLineHeightApproxTrimPx(layer, null)
  }
  const fs = resolveTextLayerFontSizePx(layer)
  const val = resolveTextLayerLineHeightValue(layer)
  if (u === "px") {
    return val
  }
  return Math.max(1, Math.round(fs * val))
}

function lineHeightConversionPatch(
  layer: TextLayer,
  nextUnit: TextLayerLineHeightUnit
): Pick<TextLayer, "lineHeight" | "lineHeightUnit"> {
  if (nextUnit === "auto") {
    return { lineHeightUnit: "auto", lineHeight: undefined }
  }
  const trim = lineHeightTrimPxForConversion(layer)
  if (nextUnit === "px") {
    return {
      lineHeightUnit: "px",
      lineHeight: Math.min(
        MAX_TEXT_LINE_HEIGHT_PX,
        Math.max(MIN_TEXT_LINE_HEIGHT_PX, trim)
      ),
    }
  }
  const fs = resolveTextLayerFontSizePx(layer)
  const em = trim / fs
  const rounded = Math.round(em * 100) / 100
  return {
    lineHeightUnit: "em",
    lineHeight: Math.min(
      MAX_TEXT_LINE_HEIGHT_EM,
      Math.max(MIN_TEXT_LINE_HEIGHT_EM, rounded)
    ),
  }
}

function isTextLayerSizing(value: string): value is "hug" | "fixed" {
  return value === "hug" || value === "fixed"
}

function isTextLayerTextAlign(
  value: string
): value is "left" | "center" | "right" {
  return value === "left" || value === "center" || value === "right"
}

function isTextLayerVerticalAlign(
  value: string
): value is "top" | "middle" | "bottom" {
  return value === "top" || value === "middle" || value === "bottom"
}

export function TextLayerSettingsPanel({
  layer,
  trimWidthPx,
  trimHeightPx,
  onUpdate,
}: TextLayerSettingsPanelProps) {
  const fontFamily = resolveTextLayerFontFamily(layer)
  const fontSizePx = resolveTextLayerFontSizePx(layer)
  const fontWeight = resolveTextLayerFontWeight(layer)
  const fontWeightPresetValues = new Set(
    TEXT_LAYER_FONT_WEIGHT_PRESETS.map((p) => p.value)
  )
  const fontWeightIsCustom = !fontWeightPresetValues.has(fontWeight)
  const lineHeightUnit = resolveTextLayerLineHeightUnit(layer)
  const lineHeightValue = resolveTextLayerLineHeightValue(layer)
  const textAlign = resolveTextLayerTextAlign(layer)
  const verticalAlign = resolveTextLayerVerticalAlign(layer)
  const color = resolveTextLayerColor(layer)
  const sizing = resolveTextLayerSizing(layer)

  const maxWidthPx = Math.max(MIN_W_TRIM, trimWidthPx - layer.x)
  const maxHeightPx = Math.max(MIN_H_TRIM, trimHeightPx - layer.y)

  const onFontSizeScrub = useCallback(
    (next: number) => {
      onUpdate({ fontSizePx: clampFontSizePx(next) })
    },
    [onUpdate]
  )

  const {
    isScrubbing: isFontSizeScrubbing,
    scrubHandlers: fontSizeScrubHandlers,
  } = useScrubNumber({
    value: fontSizePx,
    onChange: onFontSizeScrub,
    min: 8,
    max: 240,
    step: 1,
  })

  return (
    <div className={panelSectionClassName}>
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Box</span>
          <ToggleGroup
            type="single"
            variant="tile"
            size="icon"
            className="w-full"
            value={sizing}
            onValueChange={(next) => {
              if (isTextLayerSizing(next)) {
                onUpdate({ textSizing: next })
              }
            }}
          >
            <ToggleGroupItem
              value="hug"
              size="icon"
              className="flex-1"
              aria-label="Hug width and height to content"
            >
              <Shrink className="size-3.5" aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="fixed"
              size="icon"
              className="flex-1"
              aria-label="Fixed width and height"
            >
              <Square className="size-3.5" aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Bounds</span>
          <DimensionField
            width={Math.round(layer.width)}
            height={Math.round(layer.height)}
            unit="px"
            minWidth={MIN_W_TRIM}
            minHeight={MIN_H_TRIM}
            maxWidth={maxWidthPx}
            maxHeight={maxHeightPx}
            step={1}
            disabled={sizing === "hug"}
            onWidthChange={(value) =>
              onUpdate({
                width: Math.min(
                  maxWidthPx,
                  Math.max(MIN_W_TRIM, Math.round(value))
                ),
              })
            }
            onHeightChange={(value) =>
              onUpdate({
                height: Math.min(
                  maxHeightPx,
                  Math.max(MIN_H_TRIM, Math.round(value))
                ),
              })
            }
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Overflow</span>
          <label
            htmlFor={`text-layer-clip-${layer.id}`}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <Checkbox
              id={`text-layer-clip-${layer.id}`}
              checked={resolveTextLayerClip(layer)}
              onCheckedChange={(checked) => {
                if (typeof checked !== "boolean") {
                  return
                }
                onUpdate({ clip: checked })
              }}
            />
            <span className="text-sm leading-none text-foreground">
              Clip to box
            </span>
          </label>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Font</span>
          <TextLayerFontFamilyPicker
            aria-label="Font"
            value={fontFamily}
            onChange={(next) => onUpdate({ fontFamily: next })}
          />
          <div className="flex min-w-0 gap-3">
            <div className="w-[9.5rem] min-w-0 shrink-0">
              <SettingsSelect
                aria-label="Font weight"
                wrapperClassName="w-full min-w-0"
                className="pl-2 text-left"
                value={String(fontWeight)}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10)
                  if (!Number.isNaN(parsed)) {
                    onUpdate({ fontWeight: parsed })
                  }
                }}
              >
                {TEXT_LAYER_FONT_WEIGHT_PRESETS.map((preset) => (
                  <option key={preset.value} value={String(preset.value)}>
                    {preset.label}
                  </option>
                ))}
                {fontWeightIsCustom ? (
                  <option value={String(fontWeight)}>Custom</option>
                ) : null}
              </SettingsSelect>
            </div>
            <div className="min-w-0 flex-1">
              <InputGroup
                className={cn(
                  settingsInputGroupClasses(
                    cn(
                      settingsControlHeightClassName,
                      "w-full min-w-0 cursor-ew-resize"
                    )
                  ),
                  isFontSizeScrubbing && "select-none"
                )}
                {...fontSizeScrubHandlers}
              >
                <InputGroupInput
                  type="number"
                  aria-label="Font size"
                  min={8}
                  max={240}
                  step={1}
                  value={fontSizePx}
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
                      onUpdate({ fontSizePx: clampFontSizePx(parsed) })
                    }
                  }}
                />
              </InputGroup>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Line height</span>
          <div className="flex min-w-0 gap-2">
            <InputGroup
              className={settingsInputGroupClasses(
                cn(settingsControlHeightClassName, "min-w-0 flex-1")
              )}
            >
              <InputGroupInput
                type={lineHeightUnit === "auto" ? "text" : "number"}
                readOnly={lineHeightUnit === "auto"}
                disabled={lineHeightUnit === "auto"}
                aria-label={
                  lineHeightUnit === "auto"
                    ? "Line height automatic"
                    : lineHeightUnit === "px"
                      ? "Line height in pixels"
                      : "Line height in em"
                }
                {...(lineHeightUnit === "auto"
                  ? {}
                  : {
                      min:
                        lineHeightUnit === "px"
                          ? MIN_TEXT_LINE_HEIGHT_PX
                          : MIN_TEXT_LINE_HEIGHT_EM,
                      max:
                        lineHeightUnit === "px"
                          ? MAX_TEXT_LINE_HEIGHT_PX
                          : MAX_TEXT_LINE_HEIGHT_EM,
                      step: lineHeightUnit === "px" ? 1 : 0.05,
                    })}
                value={lineHeightUnit === "auto" ? "Auto" : lineHeightValue}
                className={cn(
                  settingsNumberFieldClassName,
                  settingsControlHeightClassName,
                  settingsControlLineHeightClassName,
                  settingsNumericTextClassName,
                  "min-w-0 flex-1 py-0 pr-2 pl-2 text-right",
                  lineHeightUnit === "auto" && "text-muted-foreground"
                )}
                onChange={(event) => {
                  if (lineHeightUnit === "auto") {
                    return
                  }
                  const parsed = Number.parseFloat(event.target.value)
                  if (!Number.isNaN(parsed)) {
                    onUpdate({
                      lineHeight: clampLineHeightForUnit(
                        lineHeightUnit,
                        parsed
                      ),
                    })
                  }
                }}
              />
            </InputGroup>
            <SettingsSelect
              aria-label="Line height unit"
              wrapperClassName="w-[9rem] shrink-0"
              className="pl-2 text-left"
              value={lineHeightUnit}
              onChange={(event) => {
                const next = event.target.value
                if (isTextLayerLineHeightUnit(next)) {
                  onUpdate(lineHeightConversionPatch(layer, next))
                }
              }}
            >
              <option value="auto">Auto</option>
              <option value="em">em</option>
              <option value="px">px</option>
            </SettingsSelect>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Decoration</span>
          <ToggleGroup
            type="multiple"
            variant="tile"
            size="icon"
            className="w-full"
            value={[
              ...(layer.textUnderline ? (["underline"] as const) : []),
              ...(layer.textStrikethrough ? (["strike"] as const) : []),
            ]}
            onValueChange={(next) => {
              onUpdate({
                textUnderline: next.includes("underline"),
                textStrikethrough: next.includes("strike"),
              })
            }}
          >
            <ToggleGroupItem
              value="underline"
              size="icon"
              className="flex-1"
              aria-label="Underline"
            >
              <Underline className="size-3.5" aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="strike"
              size="icon"
              className="flex-1"
              aria-label="Strikethrough"
            >
              <Strikethrough className="size-3.5" aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Align</span>
          <div className="flex w-full min-w-0 gap-1.5">
            <ToggleGroup
              type="single"
              variant="tile"
              size="icon"
              className="min-w-0 flex-[1.2]"
              value={textAlign}
              onValueChange={(next) => {
                if (isTextLayerTextAlign(next)) {
                  onUpdate({ textAlign: next })
                }
              }}
            >
              <ToggleGroupItem
                value="left"
                size="icon"
                className="flex-1"
                aria-label="Align left"
              >
                <AlignLeft className="size-3.5" aria-hidden />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="center"
                size="icon"
                className="flex-1"
                aria-label="Align center"
              >
                <AlignCenter className="size-3.5" aria-hidden />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="right"
                size="icon"
                className="flex-1"
                aria-label="Align right"
              >
                <AlignRight className="size-3.5" aria-hidden />
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              variant="tile"
              size="icon"
              className="min-w-0 flex-1"
              value={verticalAlign}
              onValueChange={(next) => {
                if (isTextLayerVerticalAlign(next)) {
                  onUpdate({ verticalAlign: next })
                }
              }}
            >
              <ToggleGroupItem
                value="top"
                size="icon"
                className="flex-1"
                aria-label="Align top"
              >
                <AlignVerticalJustifyStart className="size-3.5" aria-hidden />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="middle"
                size="icon"
                className="flex-1"
                aria-label="Align middle"
              >
                <AlignVerticalJustifyCenter className="size-3.5" aria-hidden />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="bottom"
                size="icon"
                className="flex-1"
                aria-label="Align bottom"
              >
                <AlignVerticalJustifyEnd className="size-3.5" aria-hidden />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Color</span>
          <ColorPickerField
            value={color}
            swatchLabel="Text color"
            hexLabel="Text color hex"
            onChange={(next) => onUpdate({ color: normalizeHexColor(next) })}
          />
        </div>
      </div>
    </div>
  )
}
