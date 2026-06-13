import type { ComponentProps } from "react"

import { Input } from "@workspace/ui/components/input"
import { settingsFieldClasses } from "./settings-field-styles"

function SettingsInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={settingsFieldClasses(className)} {...props} />
}

export { SettingsInput }
