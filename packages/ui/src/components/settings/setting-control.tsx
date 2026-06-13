"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type SettingControlProps = {
  label: string
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function SettingControl({
  label,
  children,
  side = "top",
  className,
}: SettingControlProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex", className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
