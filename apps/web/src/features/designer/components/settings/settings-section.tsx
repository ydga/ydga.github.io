import type { ReactNode } from "react"

import { SettingSection } from "@workspace/ui/components/settings/setting-section"

type SettingsSectionProps = {
  title: string
  children: ReactNode
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return <SettingSection title={title}>{children}</SettingSection>
}
