import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { IconTileToggle } from "./icon-tile-toggle"
import { panelIconTileClassName } from "./settings-field-styles"

type PanelIconTileToggleProps = ComponentProps<typeof IconTileToggle>

export function PanelIconTileToggle({
  className,
  ...props
}: PanelIconTileToggleProps) {
  return (
    <IconTileToggle
      className={cn(panelIconTileClassName, className)}
      {...props}
    />
  )
}

export type { PanelIconTileToggleProps }
