import {
  useCallback,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from "react"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  settingsFieldClasses,
  settingsNumberFieldClassName,
} from "./settings-field-styles"
import { useScrubNumber } from "./use-scrub-number"

type SettingsNumberInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

function parseNumberInput(value: ComponentProps<typeof Input>["value"]) {
  if (value === undefined || value === "") {
    return 0
  }

  if (Array.isArray(value)) {
    return 0
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return 0
  }

  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function SettingsNumberInput({
  className,
  value: valueProp,
  defaultValue,
  min,
  max,
  step = 1,
  disabled,
  onChange,
  ...props
}: SettingsNumberInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    parseNumberInput(defaultValue)
  )
  const isControlled = valueProp !== undefined
  const numericValue = parseNumberInput(
    isControlled ? valueProp : uncontrolledValue
  )

  const emitChange = useCallback(
    (next: number) => {
      if (!isControlled) {
        setUncontrolledValue(next)
      }

      onChange?.({
        target: { value: String(next) },
        currentTarget: { value: String(next) },
      } as ChangeEvent<HTMLInputElement>)
    },
    [isControlled, onChange]
  )

  const { isScrubbing, scrubHandlers } = useScrubNumber({
    value: numericValue,
    onChange: emitChange,
    min: min !== undefined ? Number(min) : undefined,
    max: max !== undefined ? Number(max) : undefined,
    step: Number(step),
    disabled,
  })

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={isControlled ? valueProp : uncontrolledValue}
      className={cn(
        settingsFieldClasses(settingsNumberFieldClassName),
        isScrubbing && "select-none",
        className
      )}
      onChange={(event) => {
        const parsed = Number.parseFloat(event.target.value)
        if (!Number.isNaN(parsed)) {
          emitChange(parsed)
        }
      }}
      {...scrubHandlers}
      {...props}
    />
  )
}

export { SettingsNumberInput }
