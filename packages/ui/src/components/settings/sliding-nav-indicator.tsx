"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"

import { cn } from "@workspace/ui/lib/utils"

type SlidingNavVariant = "primary" | "segmented"

const slidingNavIndicatorVariants: Record<SlidingNavVariant, string> = {
  primary: "bg-primary",
  segmented: "rounded-squircle bg-background shadow-sm [corner-shape:round]",
}

/** Icon/label color on top of the primary sliding nav indicator. */
const slidingNavActiveItemClassName = cn(
  "text-primary-foreground hover:text-primary-foreground",
  "[&_svg]:stroke-current [&_svg]:text-primary-foreground",
  "hover:[&_svg]:text-primary-foreground"
)

type SlidingNavMetrics = {
  x: number
  y: number
  width: number
  height: number
}

type SlidingNavIndicatorProps = {
  activeIndex: number | null
  variant?: SlidingNavVariant
  className?: string
  indicatorClassName?: string
  children: ReactNode
}

function SlidingNavIndicator({
  activeIndex,
  variant = "primary",
  className,
  indicatorClassName,
  children,
}: SlidingNavIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<SlidingNavMetrics | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || activeIndex === null || activeIndex < 0) {
      setMetrics(null)
      return
    }

    const items = container.querySelectorAll("[data-sliding-nav-item]")
    const active = items[activeIndex] as HTMLElement | undefined
    if (!active) {
      setMetrics(null)
      return
    }

    function measure() {
      const containerRect = container!.getBoundingClientRect()
      const activeRect = active!.getBoundingClientRect()

      setMetrics({
        x: activeRect.left - containerRect.left,
        y: activeRect.top - containerRect.top,
        width: activeRect.width,
        height: activeRect.height,
      })
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(active)

    return () => observer.disconnect()
  }, [activeIndex, children])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        aria-hidden
        className={cn(
          "rounded-squircle pointer-events-none absolute top-0 left-0 transition-[transform,width,height,opacity] duration-200 ease-out",
          metrics ? "opacity-100" : "opacity-0",
          slidingNavIndicatorVariants[variant],
          indicatorClassName
        )}
        style={
          metrics
            ? {
                width: metrics.width,
                height: metrics.height,
                transform: `translate3d(${metrics.x}px, ${metrics.y}px, 0)`,
              }
            : undefined
        }
      />
      {children}
    </div>
  )
}

function SlidingNavItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-sliding-nav-item
      className={cn("relative z-10 min-w-0", className)}
      {...props}
    />
  )
}

export {
  SlidingNavIndicator,
  SlidingNavItem,
  slidingNavActiveItemClassName,
  slidingNavIndicatorVariants,
  type SlidingNavVariant,
}
