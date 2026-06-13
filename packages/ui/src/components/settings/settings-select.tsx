import type { ComponentProps, ReactNode } from "react"
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
  settingsInlineLabelAddonClassName,
  settingsInlineLabelClassName,
  settingsInputGroupClasses,
  settingsControlLineHeightClassName,
  settingsNumericTextClassName,
} from "./settings-field-styles"

type SettingsSelectProps = ComponentProps<"select"> & {
  label?: ReactNode
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
  const hasLabel = label != null

  const labelNode = hasLabel ? (
    labelTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(settingsInlineLabelClassName, "select-none")}>
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{labelTooltip}</TooltipContent>
      </Tooltip>
    ) : (
      <span className={cn(settingsInlineLabelClassName, "select-none")}>
        {label}
      </span>
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
        <InputGroupAddon
          align="inline-start"
          className={settingsInlineLabelAddonClassName}
        >
          {labelNode}
        </InputGroupAddon>
      ) : null}
      <select
        data-slot="input-group-control"
        className={cn(
          settingsControlHeightClassName,
          settingsNumericTextClassName,
          "min-w-0 flex-1 cursor-pointer appearance-none rounded-none border-0 bg-transparent py-0 pr-7 shadow-none outline-none focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none",
          hasLabel ? "pl-0 text-right" : "pl-2 text-left",
          settingsControlLineHeightClassName,
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
