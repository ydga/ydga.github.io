"use client"

import { SlidingSegmentedTabs } from "@workspace/ui/components/settings/sliding-segmented-tabs"

export type PresetCategory = "screen" | "print"

type PresetCategoryTabsProps = {
  value: PresetCategory
  onValueChange: (value: PresetCategory) => void
}

export function PresetCategoryTabs({
  value,
  onValueChange,
}: PresetCategoryTabsProps) {
  return (
    <SlidingSegmentedTabs
      value={value}
      onValueChange={(next) => {
        if (next === "screen" || next === "print") {
          onValueChange(next)
        }
      }}
      items={[
        {
          value: "screen",
          ariaLabel: "Screen presets — dimensions for digital / display",
          content: "Screen",
        },
        {
          value: "print",
          ariaLabel:
            "Print presets — dimensions for print with bleed and safe area",
          content: "Print",
        },
      ]}
    />
  )
}
