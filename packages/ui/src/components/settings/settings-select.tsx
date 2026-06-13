import type { ComponentProps } from "react"
import { ChevronDown } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
} from "@workspace/ui/components/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import {
  settingsControlHeightClassName,
  settingsFieldClasses,
  settingsInputGroupClasses,
  settingsLabelClassName,
  settingsNumericTextClassName,
} from "./settings-field-styles"

type SettingsSelectProps = ComponentProps<"select"> & {
  label?: string
  labelTooltip?: string
  wrapperClassName?: string
}

function SettingsSelect({
  className,
  wrapperClassName,
  label,
  labelTooltip,
  children,
  ...props
}: SettingsSelectProps) {
  const labelNode = label ? (
    labelTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(settingsLabelClassName, "select-none")}>
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{labelTooltip}</TooltipContent>
      </Tooltip>
    ) : (
      <span className={cn(settingsLabelClassName, "select-none")}>{label}</span>
    )
  ) : null

  return (
    <InputGroup
      className={settingsInputGroupClasses(
        cn(
          "relative w-fit gap-0",
          settingsControlHeightClassName,
          wrapperClassName
        )
      )}
    >
      {labelNode ? (
        <InputGroupAddon align="inline-start" className="py-0 pr-0 pl-1.5">
          {labelNode}
        </InputGroupAddon>
      ) : null}
      <select
        data-slot="input-group-control"
        className={cn(
          settingsFieldClasses(
            cn(
              settingsControlHeightClassName,
              settingsNumericTextClassName,
              "min-w-0 flex-1 cursor-pointer appearance-none rounded-none border-0 bg-transparent py-0 pr-7 text-right shadow-none focus-visible:border-0 focus-visible:ring-0",
              label ? "pl-0" : "pl-2"
            )
          ),
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </InputGroup>
  )
}

export { SettingsSelect }
