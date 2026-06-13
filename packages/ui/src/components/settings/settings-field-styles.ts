import { cn } from "@workspace/ui/lib/utils"

export const settingsFieldClassName =
  "border-0 bg-muted shadow-none focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-muted/80"

export const settingsInputGroupClassName =
  "border-0 bg-muted shadow-none dark:bg-muted/80 has-[[data-slot=input-group-control]:focus-visible]:border has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50"

export function settingsFieldClasses(className?: string) {
  return cn(settingsFieldClassName, className)
}

export function settingsInputGroupClasses(className?: string) {
  return cn(settingsInputGroupClassName, className)
}
