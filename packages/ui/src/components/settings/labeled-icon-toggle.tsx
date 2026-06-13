import type { ComponentProps } from "react"

import { SettingControl } from "./setting-control"
import { IconTileToggle } from "./icon-tile-toggle"

type LabeledIconToggleProps = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
  disabled?: boolean
  onCheckedChange: (value: boolean) => void
  iconClassName?: string
  toggleProps?: Omit<
    ComponentProps<typeof IconTileToggle>,
    "pressed" | "disabled" | "aria-label" | "onPressedChange" | "children"
  >
}

function LabeledIconToggle({
  label,
  icon: Icon,
  checked,
  disabled,
  onCheckedChange,
  iconClassName = "size-3.5",
  toggleProps,
}: LabeledIconToggleProps) {
  return (
    <SettingControl label={label}>
      <IconTileToggle
        pressed={checked}
        disabled={disabled}
        aria-label={label}
        onPressedChange={onCheckedChange}
        {...toggleProps}
      >
        <Icon className={iconClassName} />
      </IconTileToggle>
    </SettingControl>
  )
}

export { LabeledIconToggle }
