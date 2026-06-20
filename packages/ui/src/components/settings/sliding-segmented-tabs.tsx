"use client"

import type { ReactNode } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  SlidingNavIndicator,
  SlidingNavItem,
} from "@workspace/ui/components/settings/sliding-nav-indicator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { settingsControlHeightClassName } from "@workspace/ui/components/settings/settings-field-styles"
import { cn } from "@workspace/ui/lib/utils"

export type SlidingSegmentedTabItem = {
  value: string
  content: ReactNode
  ariaLabel: string
  tooltip?: string
}

const slidingSegmentedTabsTriggerClassName =
  "h-full min-h-0 w-full flex-1 items-center justify-center rounded-squircle px-2 py-0 text-xs font-medium leading-none text-foreground/70 hover:text-foreground data-active:bg-transparent data-active:text-foreground data-active:shadow-none"

type SlidingSegmentedTabsProps = {
  value: string
  onValueChange: (value: string) => void
  items: readonly SlidingSegmentedTabItem[]
  className?: string
}

/**
 * Segmented control with a sliding pill (same pattern as Screen / Print presets).
 * Supports text, icons, or both; optional per-segment tooltips.
 */
export function SlidingSegmentedTabs({
  value,
  onValueChange,
  items,
  className,
}: SlidingSegmentedTabsProps) {
  const activeIndex = items.findIndex((item) => item.value === value)
  const indicatorIndex = activeIndex >= 0 ? activeIndex : 0

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (items.some((item) => item.value === next)) {
          onValueChange(next)
        }
      }}
      className={cn("w-full gap-0", className)}
    >
      <TabsList
        className={cn(
          "rounded-squircle w-full items-stretch bg-muted p-0.5",
          settingsControlHeightClassName,
          // Cancel the base TabsList h-9 that applies on horizontal orientation
          "group-data-horizontal/tabs:h-7",
          "[corner-shape:round]"
        )}
      >
        <SlidingNavIndicator
          activeIndex={indicatorIndex}
          variant="segmented"
          className="flex h-full min-h-0 w-full flex-1"
        >
          {items.map((item) => (
            <SlidingNavItem
              key={item.value}
              className="flex h-full min-h-0 flex-1 items-stretch"
            >
              {item.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value={item.value}
                      aria-label={item.ariaLabel}
                      className={slidingSegmentedTabsTriggerClassName}
                    >
                      {item.content}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">{item.tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <TabsTrigger
                  value={item.value}
                  aria-label={item.ariaLabel}
                  className={slidingSegmentedTabsTriggerClassName}
                >
                  {item.content}
                </TabsTrigger>
              )}
            </SlidingNavItem>
          ))}
        </SlidingNavIndicator>
      </TabsList>
      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          forceMount
          className="sr-only"
        />
      ))}
    </Tabs>
  )
}
