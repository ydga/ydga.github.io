import type { ComponentProps } from "react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { panelIconTileClassName } from "./settings-field-styles"

type PanelIconTileButtonProps = ComponentProps<typeof Button>

export function PanelIconTileButton({
  variant = "iconTile",
  size = "icon-tile",
  className,
  ...props
}: PanelIconTileButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(panelIconTileClassName, className)}
      {...props}
    />
  )
}

export type { PanelIconTileButtonProps }
