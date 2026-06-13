import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"
import { slidingNavActiveItemClassName } from "./sliding-nav-indicator"

type NavIconButtonProps = ComponentProps<"button"> & {
  active?: boolean
}

function NavIconButton({
  active = false,
  className,
  type = "button",
  ...props
}: NavIconButtonProps) {
  return (
    <button
      type={type}
      data-active={active ? "" : undefined}
      className={cn(
        "rounded-squircle inline-flex size-11 shrink-0 items-center justify-center border-0 bg-transparent shadow-none transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        active && slidingNavActiveItemClassName,
        className
      )}
      {...props}
    />
  )
}

export { NavIconButton }
