import { cn } from "@workspace/ui/lib/utils"

export const settingsControlHeightClassName = "h-7"
export const settingsNumericTextClassName = "settings-numeric"
export const settingsLabelClassName =
  "text-xs font-medium text-muted-foreground"

export const settingsFieldClassName =
  "border-0 bg-muted shadow-none focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-muted/80"

export const settingsNumberFieldClassName =
  "appearance-textfield [-moz-appearance:textfield] cursor-ew-resize [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"

export const settingsInputGroupClassName =
  "border-0 bg-muted shadow-none dark:bg-muted/80 has-[[data-slot=input-group-control]:focus-visible]:border has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50"

export function settingsFieldClasses(className?: string) {
  return cn(settingsFieldClassName, className)
}

export function settingsInputGroupClasses(className?: string) {
  return cn(settingsInputGroupClassName, className)
}
