import { useCallback } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowLeftRight,
  ArrowUpDown,
  CaseLower,
  CaseUpper,
  Lock,
  Square,
  Strikethrough,
  Underline,
  UnfoldHorizontal,
  UnfoldVertical,
} from "lucide-react"
import { PanelIconTileToggle } from "@workspace/ui/components/settings/panel-icon-tile-toggle"

import type {
  TextLayer,
  TextLayerLetterSpacingUnit,
  TextLayerUpdatePatch,
} from "@/features/designer/model/layers"
import {
  MAX_TEXT_LINE_HEIGHT_EM,
  MAX_TEXT_LINE_HEIGHT_PX,
  MIN_TEXT_LINE_HEIGHT_EM,
  MIN_TEXT_LINE_HEIGHT_PX,
  TEXT_LAYER_FONT_WEIGHT_PRESETS,
  type TextLayerSizing,
  resolveTextLayerClip,
  resolveTextLayerColor,
  resolveTextLayerFontFamily,
  resolveTextLayerFontSizePx,
  resolveTextLayerFontWeight,
  resolveTextLayerLetterSpacingUnit,
  resolveTextLayerLetterSpacingValue,
  resolveTextLayerLineHeightUnit,
  resolveTextLayerLineHeightValue,
  resolveTextLayerMaintainBoundsAspect,
  resolveTextLayerOpacity,
  resolveTextLayerSizing,
  resolveTextLayerTextAlign,
  resolveTextLayerTextTransform,
  resolveTextLayerVerticalAlign,
} from "@/features/designer/model/text-layer-style"
import { TextLayerFontFamilyPicker } from "@/features/designer/components/settings/text-layer-font-family-picker"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { ColorPickerField } from "@workspace/ui/components/settings/color-picker"
import { DimensionField } from "@workspace/ui/components/settings/dimension-field"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { SlidingSegmentedTabItem } from "@workspace/ui/components/settings/sliding-segmented-tabs"
import { SlidingSegmentedTabs } from "@workspace/ui/components/settings/sliding-segmented-tabs"
import {
  panelIconClassName,
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

const MIN_W_TRIM = 48
const MIN_H_TRIM = 36

const TEXT_ALIGN_TAB_ITEMS: SlidingSegmentedTabItem[] = [
  {
    value: "left",
    ariaLabel: "Align text left",
    tooltip: "Left",
    content: <AlignLeft className="size-3.5" aria-hidden />,
  },
  {
    value: "center",
    ariaLabel: "Align text center",
    tooltip: "Center",
    content: <AlignCenter className="size-3.5" aria-hidden />,
  },
  {
    value: "right",
    ariaLabel: "Align text right",
    tooltip: "Right",
    content: <AlignRight className="size-3.5" aria-hidden />,
  },
]

const VERTICAL_ALIGN_TAB_ITEMS: SlidingSegmentedTabItem[] = [
  {
    value: "top",
    ariaLabel: "Align text to top",
    tooltip: "Top",
    content: <AlignVerticalJustifyStart className="size-3.5" aria-hidden />,
  },
  {
    value: "middle",
    ariaLabel: "Align text to middle",
    tooltip: "Middle",
    content: <AlignVerticalJustifyCenter className="size-3.5" aria-hidden />,
  },
  {
    value: "bottom",
    ariaLabel: "Align text to bottom",
    tooltip: "Bottom",
    content: <AlignVerticalJustifyEnd className="size-3.5" aria-hidden />,
  },
]

const TEXT_LAYER_SIZING_TAB_ITEMS: SlidingSegmentedTabItem[] = [
  {
    value: "auto-width",
    ariaLabel: "Auto width — box grows with text width and height",
    tooltip: "Auto width",
    content: <UnfoldHorizontal className="size-3.5" aria-hidden />,
  },
  {
    value: "auto-height",
    ariaLabel: "Auto height — fixed width, height follows wrapped text",
    tooltip: "Auto height",
    content: <UnfoldVertical className="size-3.5" aria-hidden />,
  },
  {
    value: "fixed",
    ariaLabel: "Fixed size — explicit width and height",
    tooltip: "Fixed size",
    content: <Square className="size-3.5" aria-hidden />,
  },
  {
    value: "locked",
    ariaLabel: "Fixed size with locked proportions",
    tooltip: "Lock proportions",
    content: <Lock className="size-3.5" aria-hidden />,
  },
]

type TextLayerSettingsPanelProps = {
  layer: TextLayer
  trimWidthPx: number
  trimHeightPx: number
  onUpdate: (patch: TextLayerUpdatePatch) => void
}

function clampFontSizePx(value: number) {
  return Math.min(240, Math.max(8, Math.round(value)))
}

/**
 * Parse a smart spacing input:
 *  - `"24"` or `"24px"` → `{ value: 24, unit: "px" }`
 *  - `"150%"` or `"1.5em"` → `{ value: 1.5, unit: "em" }`
 *  - `""` / `"auto"` → `null` (caller maps to auto/zero as appropriate)
 */
function parseSpacingInput(
  raw: string
): { value: number; unit: "px" | "em" } | null {
  const s = raw.trim().toLowerCase()
  if (!s || s === "auto") return null
  if (s.endsWith("%")) {
    const n = parseFloat(s)
    if (!Number.isFinite(n)) return null
    return { value: Math.round((n / 100) * 1000) / 1000, unit: "em" }
  }
  if (s.endsWith("em")) {
    const n = parseFloat(s)
    if (!Number.isFinite(n)) return null
    return { value: Math.round(n * 1000) / 1000, unit: "em" }
  }
  const n = parseFloat(s)
  if (!Number.isFinite(n)) return null
  return { value: n, unit: "px" }
}

/** Format a stored line-height / letter-spacing value for the smart input. */
function formatSpacingDisplay(
  value: number,
  unit: "px" | "em" | "auto"
): string {
  if (unit === "auto") return "Auto"
  if (unit === "em") return `${Math.round(value * 100)}%`
  return String(Math.round(value * 10) / 10)
}

function isTextLayerSizing(value: string): value is TextLayerSizing {
  return value === "auto-width" || value === "auto-height" || value === "fixed"
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

function pairFixedBoundsToAspect(
  anchor: "width" | "height",
  raw: number,
  ratioHeightPerWidth: number,
  maxWidthPx: number,
  maxHeightPx: number
): { width: number; height: number } {
  const minW = MIN_W_TRIM
  const minH = MIN_H_TRIM
  const maxW = maxWidthPx
  const maxH = maxHeightPx
  const r =
    ratioHeightPerWidth > 0 && Number.isFinite(ratioHeightPerWidth)
      ? ratioHeightPerWidth
      : 1

  if (anchor === "width") {
    let w = Math.min(maxW, Math.max(minW, Math.round(raw)))
    let h = Math.round(w * r)
    if (h > maxH) {
      h = maxH
      w = Math.min(maxW, Math.max(minW, Math.round(h / r)))
    } else if (h < minH) {
      h = minH
      w = Math.min(maxW, Math.max(minW, Math.round(h / r)))
    }
    return { width: w, height: h }
  }

  let h = Math.min(maxH, Math.max(minH, Math.round(raw)))
  let w = Math.round(h / r)
  if (w > maxW) {
    w = maxW
    h = Math.min(maxH, Math.max(minH, Math.round(w * r)))
  } else if (w < minW) {
    w = minW
    h = Math.min(maxH, Math.max(minH, Math.round(w * r)))
  }
  return { width: w, height: h }
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
  const letterSpacingUnit = resolveTextLayerLetterSpacingUnit(layer)
  const letterSpacingValue = resolveTextLayerLetterSpacingValue(layer)
  const textAlign = resolveTextLayerTextAlign(layer)
  const verticalAlign = resolveTextLayerVerticalAlign(layer)
  const color = resolveTextLayerColor(layer)
  const opacity = Math.round(resolveTextLayerOpacity(layer) * 100)
  const decoration = layer.textStrikethrough
    ? "strike"
    : layer.textUnderline
      ? "underline"
      : "normal"
  const textTransform = resolveTextLayerTextTransform(layer)
  const sizing = resolveTextLayerSizing(layer)
  const maintainAspect = resolveTextLayerMaintainBoundsAspect(layer)
  const fixedSizing = sizing === "fixed"
  const sizingTabValue =
    sizing === "fixed" && maintainAspect ? "locked" : sizing
  const aspectRatio =
    layer.width > 0 && layer.height > 0 ? layer.height / layer.width : 1

  const maxWidthPx = Math.max(MIN_W_TRIM, trimWidthPx - layer.x)
  const maxHeightPx = Math.max(MIN_H_TRIM, trimHeightPx - layer.y)

  const onBoundsWidthChange = useCallback(
    (value: number) => {
      if (fixedSizing && maintainAspect) {
        onUpdate(
          pairFixedBoundsToAspect(
            "width",
            value,
            aspectRatio,
            maxWidthPx,
            maxHeightPx
          )
        )
        return
      }
      onUpdate({
        width: Math.min(maxWidthPx, Math.max(MIN_W_TRIM, Math.round(value))),
      })
    },
    [
      aspectRatio,
      fixedSizing,
      maintainAspect,
      maxHeightPx,
      maxWidthPx,
      onUpdate,
    ]
  )

  const onBoundsHeightChange = useCallback(
    (value: number) => {
      if (fixedSizing && maintainAspect) {
        onUpdate(
          pairFixedBoundsToAspect(
            "height",
            value,
            aspectRatio,
            maxWidthPx,
            maxHeightPx
          )
        )
        return
      }
      onUpdate({
        height: Math.min(maxHeightPx, Math.max(MIN_H_TRIM, Math.round(value))),
      })
    },
    [
      aspectRatio,
      fixedSizing,
      maintainAspect,
      maxHeightPx,
      maxWidthPx,
      onUpdate,
    ]
  )

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

  const {
    isScrubbing: isOpacityScrubbing,
    scrubHandlers: opacityScrubHandlers,
  } = useScrubNumber({
    value: opacity,
    onChange: (next) =>
      onUpdate({ opacity: Math.min(100, Math.max(0, Math.round(next))) }),
    min: 0,
    max: 100,
    step: 1,
  })

  return (
    <div className={panelSectionClassName}>
      <SettingSection title="Bounding box">
        <SlidingSegmentedTabs
          value={sizingTabValue}
          onValueChange={(next) => {
            if (next === "locked") {
              onUpdate({ textSizing: "fixed", maintainBoundsAspect: true })
            } else if (isTextLayerSizing(next)) {
              onUpdate({ textSizing: next, maintainBoundsAspect: false })
            }
          }}
          items={TEXT_LAYER_SIZING_TAB_ITEMS}
        />
        <DimensionField
          width={Math.round(layer.width)}
          height={Math.round(layer.height)}
          minWidth={MIN_W_TRIM}
          minHeight={MIN_H_TRIM}
          maxWidth={maxWidthPx}
          maxHeight={maxHeightPx}
          step={1}
          disabledWidth={sizing === "auto-width"}
          disabledHeight={sizing !== "fixed"}
          onWidthChange={onBoundsWidthChange}
          onHeightChange={onBoundsHeightChange}
        />
        <label
          htmlFor={`text-layer-clip-${layer.id}`}
          className="mt-1 flex cursor-pointer items-center gap-2"
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
          <span className="text-xs leading-none text-foreground">
            Clip to box
          </span>
        </label>
      </SettingSection>

      <SettingSection title="Font">
        <TextLayerFontFamilyPicker
          aria-label="Font"
          value={fontFamily}
          onChange={(next) => onUpdate({ fontFamily: next })}
        />
        <div className="flex min-w-0 gap-2">
          <div className="min-w-0 flex-1">
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
        <div className="flex min-w-0 gap-2">
          <InputGroup
            className={settingsInputGroupClasses(
              cn(settingsControlHeightClassName, "min-w-0 flex-1")
            )}
          >
            <InputGroupAddon
              align="inline-start"
              className={settingsInlineLabelAddonClassName}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={settingsInlineLabelClassName}>
                    <ArrowUpDown
                      className="size-3 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Line height</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              aria-label="Line height — enter a number for px (e.g. 24) or percentage for em (e.g. 150%)"
              placeholder="Auto"
              defaultValue={
                lineHeightUnit === "auto"
                  ? ""
                  : formatSpacingDisplay(lineHeightValue, lineHeightUnit)
              }
              key={`lh-${lineHeightUnit}-${lineHeightValue}`}
              className={cn(
                settingsControlHeightClassName,
                settingsControlLineHeightClassName,
                settingsNumericTextClassName,
                "min-w-0 flex-1 border-0 bg-transparent py-0 pr-2 pl-1 text-right outline-none"
              )}
              onBlur={(event) => {
                const parsed = parseSpacingInput(event.target.value)
                if (parsed === null) {
                  onUpdate({ lineHeightUnit: "auto", lineHeight: undefined })
                } else if (parsed.unit === "px") {
                  onUpdate({
                    lineHeightUnit: "px",
                    lineHeight: Math.min(
                      MAX_TEXT_LINE_HEIGHT_PX,
                      Math.max(
                        MIN_TEXT_LINE_HEIGHT_PX,
                        Math.round(parsed.value)
                      )
                    ),
                  })
                } else {
                  onUpdate({
                    lineHeightUnit: "em",
                    lineHeight: Math.min(
                      MAX_TEXT_LINE_HEIGHT_EM,
                      Math.max(
                        MIN_TEXT_LINE_HEIGHT_EM,
                        Math.round(parsed.value * 100) / 100
                      )
                    ),
                  })
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
            />
          </InputGroup>
          <InputGroup
            className={settingsInputGroupClasses(
              cn(settingsControlHeightClassName, "min-w-0 flex-1")
            )}
          >
            <InputGroupAddon
              align="inline-start"
              className={settingsInlineLabelAddonClassName}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={settingsInlineLabelClassName}>
                    <ArrowLeftRight
                      className="size-3 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Letter spacing</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              aria-label="Letter spacing — enter a number for px (e.g. 2) or percentage for em (e.g. 10%)"
              placeholder="0"
              defaultValue={
                letterSpacingValue === 0
                  ? ""
                  : formatSpacingDisplay(letterSpacingValue, letterSpacingUnit)
              }
              key={`ls-${letterSpacingUnit}-${letterSpacingValue}`}
              className={cn(
                settingsControlHeightClassName,
                settingsControlLineHeightClassName,
                settingsNumericTextClassName,
                "min-w-0 flex-1 border-0 bg-transparent py-0 pr-2 pl-1 text-right outline-none"
              )}
              onBlur={(event) => {
                const parsed = parseSpacingInput(event.target.value)
                if (parsed === null) {
                  onUpdate({ letterSpacing: 0, letterSpacingUnit: "px" })
                } else {
                  onUpdate({
                    letterSpacing: parsed.value,
                    letterSpacingUnit:
                      parsed.unit as TextLayerLetterSpacingUnit,
                  })
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
            />
          </InputGroup>
        </div>
        <div className="flex w-full items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <PanelIconTileToggle
                aria-label="Underline"
                pressed={decoration === "underline"}
                onPressedChange={(on) =>
                  onUpdate({
                    textUnderline: on,
                    textStrikethrough: on ? false : layer.textStrikethrough,
                  })
                }
              >
                <Underline className={panelIconClassName} />
              </PanelIconTileToggle>
            </TooltipTrigger>
            <TooltipContent side="top">Underline</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <PanelIconTileToggle
                aria-label="Strikethrough"
                pressed={decoration === "strike"}
                onPressedChange={(on) =>
                  onUpdate({
                    textStrikethrough: on,
                    textUnderline: on ? false : layer.textUnderline,
                  })
                }
              >
                <Strikethrough className={panelIconClassName} />
              </PanelIconTileToggle>
            </TooltipTrigger>
            <TooltipContent side="top">Strikethrough</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px shrink-0 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <PanelIconTileToggle
                aria-label="All caps"
                pressed={textTransform === "uppercase"}
                onPressedChange={(on) =>
                  onUpdate({ textTransform: on ? "uppercase" : "none" })
                }
              >
                <CaseUpper className={panelIconClassName} />
              </PanelIconTileToggle>
            </TooltipTrigger>
            <TooltipContent side="top">All caps</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <PanelIconTileToggle
                aria-label="Lowercase"
                pressed={textTransform === "lowercase"}
                onPressedChange={(on) =>
                  onUpdate({ textTransform: on ? "lowercase" : "none" })
                }
              >
                <CaseLower className={panelIconClassName} />
              </PanelIconTileToggle>
            </TooltipTrigger>
            <TooltipContent side="top">Lowercase</TooltipContent>
          </Tooltip>
        </div>
      </SettingSection>

      <SettingSection title="Align">
        <div className="flex w-full min-w-0 gap-2">
          <SlidingSegmentedTabs
            className="min-w-0 flex-1"
            value={textAlign}
            onValueChange={(next) => {
              if (isTextLayerTextAlign(next)) {
                onUpdate({ textAlign: next })
              }
            }}
            items={TEXT_ALIGN_TAB_ITEMS}
          />
          <SlidingSegmentedTabs
            className="min-w-0 flex-1"
            value={verticalAlign}
            onValueChange={(next) => {
              if (isTextLayerVerticalAlign(next)) {
                onUpdate({ verticalAlign: next })
              }
            }}
            items={VERTICAL_ALIGN_TAB_ITEMS}
          />
        </div>
      </SettingSection>

      <SettingSection title="Color">
        <div className="flex w-full min-w-0 gap-2">
          <ColorPickerField
            className="min-w-0 flex-1"
            value={color}
            swatchLabel="Text color"
            hexLabel="Text color hex"
            onChange={(next) => onUpdate({ color: normalizeHexColor(next) })}
          />
          <InputGroup
            className={cn(
              settingsInputGroupClasses(
                cn(
                  settingsControlHeightClassName,
                  "w-16 shrink-0 cursor-ew-resize"
                )
              ),
              isOpacityScrubbing && "select-none"
            )}
            {...opacityScrubHandlers}
          >
            <InputGroupAddon
              align="inline-start"
              className={cn(
                settingsInlineLabelAddonClassName,
                "cursor-ew-resize"
              )}
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
              value={opacity}
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
                  onUpdate({
                    opacity: Math.min(100, Math.max(0, Math.round(parsed))),
                  })
                }
              }}
            />
          </InputGroup>
        </div>
      </SettingSection>
    </div>
  )
}
