import { Shrink, Square } from "lucide-react"

import type {
  TextLayer,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  TEXT_LAYER_FONT_PRESETS,
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerSizing,
} from "@/features/designer/model/text-layer-style"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
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

function isTextLayerSizing(value: string): value is "hug" | "fixed" {
  return value === "hug" || value === "fixed"
}

export function TextLayerSettingsPanel({
  layer,
  trimWidthPx,
  trimHeightPx,
  onUpdate,
}: TextLayerSettingsPanelProps) {
  const fontFamily = resolveTextLayerFontFamily(layer)
  const fontSizePx = resolveTextLayerFontSizePx(layer)
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
              aria-label="Hug content"
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

        {sizing === "fixed" ? (
          <div className="flex min-w-0 gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={settingsLabelClassName}>W</span>
              <SettingsInput
                type="number"
                aria-label="Box width"
                min={MIN_W_TRIM}
                max={maxWidthPx}
                step={1}
                value={Math.round(layer.width)}
                className="h-7 w-full min-w-0 font-mono tabular-nums"
                onChange={(event) => {
                  const parsed = Number.parseFloat(event.target.value)
                  if (!Number.isNaN(parsed)) {
                    onUpdate({
                      width: Math.min(
                        maxWidthPx,
                        Math.max(MIN_W_TRIM, Math.round(parsed))
                      ),
                    })
                  }
                }}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={settingsLabelClassName}>H</span>
              <SettingsInput
                type="number"
                aria-label="Box height"
                min={MIN_H_TRIM}
                max={maxHeightPx}
                step={1}
                value={Math.round(layer.height)}
                className="h-7 w-full min-w-0 font-mono tabular-nums"
                onChange={(event) => {
                  const parsed = Number.parseFloat(event.target.value)
                  if (!Number.isNaN(parsed)) {
                    onUpdate({
                      height: Math.min(
                        maxHeightPx,
                        Math.max(MIN_H_TRIM, Math.round(parsed))
                      ),
                    })
                  }
                }}
              />
            </div>
          </div>
        ) : null}

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
