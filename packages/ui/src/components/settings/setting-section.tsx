import { cn } from "@workspace/ui/lib/utils"
import { settingsLabelClassName } from "@workspace/ui/components/settings/settings-field-styles"

type SettingSectionProps = {
  title: string
  children: React.ReactNode
  className?: string
}

export function SettingSection({
  title,
  children,
  className,
}: SettingSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3 py-5 first:pt-0", className)}>
      <h3 className={settingsLabelClassName}>{title}</h3>
      {children}
    </section>
  )
}
