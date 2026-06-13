import type { ComponentProps } from "react"

import { SettingControl } from "./setting-control"
import { PanelIconTileToggle } from "./panel-icon-tile-toggle"
import { panelIconClassName } from "./settings-field-styles"

type LabeledIconToggleProps = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
  disabled?: boolean
  onCheckedChange: (value: boolean) => void
  iconClassName?: string
  toggleProps?: Omit<
    ComponentProps<typeof PanelIconTileToggle>,
    "pressed" | "disabled" | "aria-label" | "onPressedChange" | "children"
  >
}

function LabeledIconToggle({
  label,
  icon: Icon,
  checked,
  disabled,
  onCheckedChange,
  iconClassName = panelIconClassName,
  toggleProps,
}: LabeledIconToggleProps) {
  return (
    <SettingControl label={label}>
      <PanelIconTileToggle
        pressed={checked}
        disabled={disabled}
        aria-label={label}
        onPressedChange={onCheckedChange}
        {...toggleProps}
      >
        <Icon className={iconClassName} />
      </PanelIconTileToggle>
    </SettingControl>
  )
}

export { LabeledIconToggle }
