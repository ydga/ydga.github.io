import type { ComponentProps } from "react"

import { Toggle } from "@workspace/ui/components/toggle"
import { cn } from "@workspace/ui/lib/utils"

type IconTileToggleProps = ComponentProps<typeof Toggle>

export function IconTileToggle({
  className,
  variant = "tile",
  size = "icon",
  ...props
}: IconTileToggleProps) {
  return (
    <Toggle
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}
