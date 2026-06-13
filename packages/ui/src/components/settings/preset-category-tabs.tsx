import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

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
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (next === "screen" || next === "print") {
          onValueChange(next)
        }
      }}
      className="w-full"
    >
      <ToggleGroupItem value="screen" className="min-w-0 flex-1">
        Screen
      </ToggleGroupItem>
      <ToggleGroupItem value="print" className="min-w-0 flex-1">
        Print
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
