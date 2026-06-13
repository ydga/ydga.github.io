import { cn } from "@workspace/ui/lib/utils"

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
    <section className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-xs font-medium text-foreground">{title}</h3>
      {children}
    </section>
  )
}
