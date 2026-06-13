import type { ReactNode, Ref } from "react"

import { cn } from "@workspace/ui/lib/utils"

type FloatingChromePosition = "top-right" | "bottom-center"

type FloatingChromeProps = {
  position: FloatingChromePosition
  variant?: "frosted" | "ghost"
  fitChromeRef?: Ref<HTMLDivElement>
  children: ReactNode
  className?: string
  innerClassName?: string
}

const positionClassName: Record<FloatingChromePosition, string> = {
  "top-right":
    "absolute top-[var(--stage-chrome-inset)] right-[var(--stage-chrome-inset)] z-20",
  "bottom-center": "absolute inset-x-0 bottom-4 z-20 flex justify-center px-4",
}

function FloatingChrome({
  position,
  variant = "ghost",
  fitChromeRef,
  children,
  className,
  innerClassName,
}: FloatingChromeProps) {
  const inner =
    variant === "frosted" ? (
      <div
        className={cn(
          "rounded-squircle pointer-events-auto bg-background/90 p-2 shadow-lg backdrop-blur-md",
          innerClassName
        )}
      >
        {children}
      </div>
    ) : (
      <div className={cn("pointer-events-auto", innerClassName)}>
        {children}
      </div>
    )

  return (
    <div
      ref={fitChromeRef}
      className={cn(
        "pointer-events-none",
        positionClassName[position],
        className
      )}
    >
      {inner}
    </div>
  )
}

export { FloatingChrome, type FloatingChromeProps }
