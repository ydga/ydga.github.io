"use client"

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
import { cn } from "@workspace/ui/lib/utils"

export type PresetCategory = "screen" | "print"

type PresetCategoryTabsProps = {
  value: PresetCategory
  onValueChange: (value: PresetCategory) => void
}

const segmentTriggerClassName =
  "h-7 w-full flex-1 rounded-squircle px-2 text-xs font-medium text-foreground/70 hover:text-foreground data-active:bg-transparent data-active:text-foreground data-active:shadow-none"

export function PresetCategoryTabs({
  value,
  onValueChange,
}: PresetCategoryTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === "screen" || next === "print") {
          onValueChange(next)
        }
      }}
      className="w-full gap-0"
    >
      <TabsList
        className={cn(
          "rounded-squircle h-8 w-full bg-muted p-0.5",
          "[corner-shape:round]"
        )}
      >
        <SlidingNavIndicator
          activeIndex={value === "screen" ? 0 : 1}
          variant="segmented"
          className="flex h-full w-full"
        >
          <SlidingNavItem className="flex h-full flex-1">
            <TabsTrigger value="screen" className={segmentTriggerClassName}>
              Screen
            </TabsTrigger>
          </SlidingNavItem>
          <SlidingNavItem className="flex h-full flex-1">
            <TabsTrigger value="print" className={segmentTriggerClassName}>
              Print
            </TabsTrigger>
          </SlidingNavItem>
        </SlidingNavIndicator>
      </TabsList>
      <TabsContent value="screen" forceMount className="sr-only" />
      <TabsContent value="print" forceMount className="sr-only" />
    </Tabs>
  )
}
