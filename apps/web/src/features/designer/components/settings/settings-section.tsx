import type { ReactNode } from "react"

type SettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
