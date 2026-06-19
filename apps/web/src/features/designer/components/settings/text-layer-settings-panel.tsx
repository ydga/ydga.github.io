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
  MIN_TEXT_LINE_HEIGHT,
  MIN_TEXT_LINE_HEIGHT_EM,
  MIN_TEXT_LINE_HEIGHT_PX,
  TEXT_LAYER_FONT_PRESETS,
  resolveTextLayerClip,
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerLineHeightUnit,
  resolveTextLayerLineHeightValue,
  resolveTextLayerSizing,
  resolveTextLayerTextAlign,
  resolveTextLayerVerticalAlign,
} from "@/features/designer/model/text-layer-style"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import {
  panelSectionClassName,
  settingsLabelClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { normalizeHexColor } from "@workspace/ui/lib/color-utils"

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
  const rounded = Math.round(value * 100) / 100
  if (unit === "px") {
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_PX,
      Math.max(MIN_TEXT_LINE_HEIGHT_PX, Math.round(value))
    )
  }
  if (unit === "em") {
    return Math.min(
      MAX_TEXT_LINE_HEIGHT_EM,
      Math.max(MIN_TEXT_LINE_HEIGHT_EM, rounded)
    )
  }
  return Math.max(MIN_TEXT_LINE_HEIGHT, rounded)
}

function isTextLayerLineHeightUnit(
  value: string
): value is TextLayerLineHeightUnit {
  return value === "unitless" || value === "px" || value === "em"
}

function lineHeightTrimPxForConversion(layer: TextLayer): number {
  const fs = resolveTextLayerFontSizePx(layer)
  const u = resolveTextLayerLineHeightUnit(layer)
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
  const fs = resolveTextLayerFontSizePx(layer)
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
  if (nextUnit === "em") {
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
  const mult = trim / fs
  return {
    lineHeightUnit: "unitless",
    lineHeight: Math.max(MIN_TEXT_LINE_HEIGHT, Math.round(mult * 100) / 100),
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
  const lineHeightUnit = resolveTextLayerLineHeightUnit(layer)
  const lineHeightValue = resolveTextLayerLineHeightValue(layer)
  const textAlign = resolveTextLayerTextAlign(layer)
  const verticalAlign = resolveTextLayerVerticalAlign(layer)
  const color = resolveTextLayerColor(layer)
  const sizing = resolveTextLayerSizing(layer)

  const presetValues = new Set(
    TEXT_LAYER_FONT_PRESETS.map((preset) => preset.value)
  )
  const fontIsCustom = !presetValues.has(fontFamily)

  const maxWidthPx = Math.max(MIN_W_TRIM, trimWidthPx - layer.x)
  const maxHeightPx = Math.max(MIN_H_TRIM, trimHeightPx - layer.y)

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
          <SettingsSelect
            aria-label="Font"
            wrapperClassName="w-full min-w-0"
            className="pl-2 text-left"
            value={fontFamily}
            onChange={(event) => onUpdate({ fontFamily: event.target.value })}
          >
            {TEXT_LAYER_FONT_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
            {fontIsCustom ? <option value={fontFamily}>Custom</option> : null}
          </SettingsSelect>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Size</span>
          <SettingsInput
            type="number"
            aria-label="Font size"
            min={8}
            max={240}
            step={1}
            value={fontSizePx}
            className="h-7 w-full min-w-0 font-mono tabular-nums"
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value)
              if (!Number.isNaN(parsed)) {
                onUpdate({ fontSizePx: clampFontSizePx(parsed) })
              }
            }}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={settingsLabelClassName}>Line height</span>
          <div className="flex min-w-0 gap-2">
            <SettingsSelect
              aria-label="Line height unit"
              wrapperClassName="w-[7.5rem] shrink-0"
              className="pl-2 text-left"
              value={lineHeightUnit}
              onChange={(event) => {
                const next = event.target.value
                if (isTextLayerLineHeightUnit(next)) {
                  onUpdate(lineHeightConversionPatch(layer, next))
                }
              }}
            >
              <option value="unitless">Unitless</option>
              <option value="em">em</option>
              <option value="px">px</option>
            </SettingsSelect>
            <SettingsInput
              type="number"
              aria-label={
                lineHeightUnit === "px"
                  ? "Line height in pixels"
                  : lineHeightUnit === "em"
                    ? "Line height in em"
                    : "Line height (unitless)"
              }
              min={
                lineHeightUnit === "px"
                  ? MIN_TEXT_LINE_HEIGHT_PX
                  : lineHeightUnit === "em"
                    ? MIN_TEXT_LINE_HEIGHT_EM
                    : MIN_TEXT_LINE_HEIGHT
              }
              max={
                lineHeightUnit === "px"
                  ? MAX_TEXT_LINE_HEIGHT_PX
                  : lineHeightUnit === "em"
                    ? MAX_TEXT_LINE_HEIGHT_EM
                    : undefined
              }
              step={lineHeightUnit === "px" ? 1 : 0.05}
              value={lineHeightValue}
              className="h-7 min-w-0 flex-1 font-mono tabular-nums"
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value)
                if (!Number.isNaN(parsed)) {
                  onUpdate({
                    lineHeight: clampLineHeightForUnit(lineHeightUnit, parsed),
                  })
                }
              }}
            />
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
