import { Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type PageControlsProps = {
  pageName: string
  onPageNameChange: (name: string) => void
  className?: string
}

export function PageNameField({
  pageName,
  onPageNameChange,
  className,
}: PageControlsProps) {
  return (
    <Input
      value={pageName}
      aria-label="Page name"
      className={cn(
        "h-8 w-auto min-w-32 border-transparent bg-transparent px-2 text-center text-sm font-medium shadow-none hover:bg-muted/50 focus-visible:border-input focus-visible:bg-background",
        className
      )}
      onChange={(event) => onPageNameChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    />
  )
}

export function AddPageButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground", className)}
      disabled
      onClick={(event) => event.stopPropagation()}
    >
      <Plus data-icon="inline-start" />
      Add page
    </Button>
  )
}
