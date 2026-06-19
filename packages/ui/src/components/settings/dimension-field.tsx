import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  settingsControlHeightClassName,
  settingsInlineLabelAddonClassName,
  settingsInlineLabelClassName,
  settingsInputGroupClasses,
  settingsControlLineHeightClassName,
  settingsNumberFieldClassName,
  settingsNumericTextClassName,
} from "./settings-field-styles"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useScrubNumber } from "./use-scrub-number"

type DimensionFieldProps = {
  width: number
  height: number
  unit?: "px" | "cm"
  min?: number
  /** When set, overrides `min` for the width control only. */
  minWidth?: number
  /** When set, overrides `min` for the height control only. */
  minHeight?: number
  max?: number
  /** When set, overrides `max` for the width control only. */
  maxWidth?: number
  /** When set, overrides `max` for the height control only. */
  maxHeight?: number
  step?: number
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
  className?: string
  disabled?: boolean
}

type DimensionInputProps = {
  label: "W" | "H"
  tooltip: string
  value: number
  min: number
  max?: number
  step: number
  ariaLabel: string
  onChange: (value: number) => void
  disabled?: boolean
}

function DimensionInput({
  label,
  tooltip,
  value,
  min,
  max,
  step,
  ariaLabel,
  onChange,
  disabled,
}: DimensionInputProps) {
  const { isScrubbing, scrubHandlers } = useScrubNumber({
    value,
    onChange,
    min,
    max,
    step,
    disabled,
  })

  return (
    <InputGroup
      className={cn(
        settingsInputGroupClasses(
          cn(settingsControlHeightClassName, "min-w-0 flex-1 cursor-ew-resize")
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
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
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
            onChange(parsed)
          }
        }}
      />
    </InputGroup>
  )
}

export function DimensionField({
  width,
  height,
  unit,
  min = 1,
  minWidth,
  minHeight,
  max,
  maxWidth,
  maxHeight,
  step = 1,
  onWidthChange,
  onHeightChange,
  className,
  disabled,
}: DimensionFieldProps) {
  const unitLabel = unit ?? null
  const wMin = minWidth ?? min
  const hMin = minHeight ?? min
  const wMax = maxWidth ?? max
  const hMax = maxHeight ?? max

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <DimensionInput
        label="W"
        tooltip="Width"
        value={width}
        min={wMin}
        max={wMax}
        step={step}
        ariaLabel="Width"
        onChange={onWidthChange}
        disabled={disabled}
      />
      <DimensionInput
        label="H"
        tooltip="Height"
        value={height}
        min={hMin}
        max={hMax}
        step={step}
        ariaLabel="Height"
        onChange={onHeightChange}
        disabled={disabled}
      />
      {unitLabel ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {unitLabel}
        </span>
      ) : null}
    </div>
  )
}
