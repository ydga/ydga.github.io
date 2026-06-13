import type { ComponentProps } from "react"

import { Input } from "@workspace/ui/components/input"
import { settingsFieldClasses } from "./settings-field-styles"
import { SettingsNumberInput } from "./settings-number-input"

function SettingsInput({
  className,
  type,
  ...props
}: ComponentProps<typeof Input>) {
  if (type === "number") {
    return <SettingsNumberInput className={className} {...props} />
  }

  return (
    <Input className={settingsFieldClasses(className)} type={type} {...props} />
  )
}

export { SettingsInput }
