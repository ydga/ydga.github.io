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
  step?: number
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
  className?: string
}

type DimensionInputProps = {
  label: "W" | "H"
  tooltip: string
  value: number
  min: number
  step: number
  ariaLabel: string
  onChange: (value: number) => void
}

function DimensionInput({
  label,
  tooltip,
  value,
  min,
  step,
  ariaLabel,
  onChange,
}: DimensionInputProps) {
  const { isScrubbing, scrubHandlers } = useScrubNumber({
    value,
    onChange,
    min,
    step,
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
        step={step}
        value={value}
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
  step = 1,
  onWidthChange,
  onHeightChange,
  className,
}: DimensionFieldProps) {
  const unitLabel = unit ?? null

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <DimensionInput
        label="W"
        tooltip="Width"
        value={width}
        min={min}
        step={step}
        ariaLabel="Width"
        onChange={onWidthChange}
      />
      <DimensionInput
        label="H"
        tooltip="Height"
        value={height}
        min={min}
        step={step}
        ariaLabel="Height"
        onChange={onHeightChange}
      />
      {unitLabel ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {unitLabel}
        </span>
      ) : null}
    </div>
  )
}
