import { useState } from "react"
import { ChevronDown, ChevronUp, Copy, Frame, Plus, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { cn } from "@workspace/ui/lib/utils"

const frameNameFieldClasses =
  "h-7 w-full min-w-0 border-transparent bg-transparent shadow-none hover:bg-muted/50 has-[[data-slot=input-group-control]:focus-visible]:border-input has-[[data-slot=input-group-control]:focus-visible]:bg-background has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50"

type FrameNameFieldProps = {
  pageName: string
  onPageNameChange: (name: string) => void
  onFocus?: () => void
  className?: string
  showIcon?: boolean
}

export function FrameNameField({
  pageName,
  onPageNameChange,
  onFocus,
  className,
  showIcon = true,
}: FrameNameFieldProps) {
  return (
    <InputGroup
      className={cn(frameNameFieldClasses, className)}
      onClick={(event) => event.stopPropagation()}
    >
      {showIcon ? (
        <InputGroupAddon align="inline-start" className="py-0 pr-1 pl-2">
          <Frame className="size-3.5 text-muted-foreground" aria-hidden />
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        value={pageName}
        aria-label="Frame name"
        placeholder="Untitled"
        className={cn(
          "h-7 min-w-0 flex-1 text-left text-xs font-medium",
          showIcon ? "px-1" : "px-2"
        )}
        onChange={(event) => onPageNameChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={(event) => event.stopPropagation()}
      />
    </InputGroup>
  )
}

/** @deprecated Use FrameNameField */
export const PageNameField = FrameNameField

type AddFrameButtonProps = {
  onAddFrame: () => string
  className?: string
}

export function AddFrameButton({ onAddFrame, className }: AddFrameButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground", className)}
      onClick={(event) => {
        event.stopPropagation()
        onAddFrame()
      }}
    >
      <Plus data-icon="inline-start" />
      Add frame
    </Button>
  )
}

/** @deprecated Use AddFrameButton */
export const AddPageButton = AddFrameButton

const frameRowActionClassName =
  "size-7 text-muted-foreground opacity-0 transition-opacity group-hover/frame:opacity-100 focus-visible:opacity-100"

type DuplicateFrameButtonProps = {
  frameName: string
  onDuplicate: () => void
  className?: string
}

export function DuplicateFrameButton({
  frameName,
  onDuplicate,
  className,
}: DuplicateFrameButtonProps) {
  const label = frameName.trim() || "frame"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(frameRowActionClassName, className)}
      aria-label={`Duplicate ${label}`}
      onClick={(event) => {
        event.stopPropagation()
        onDuplicate()
      }}
    >
      <Copy className="size-3.5" />
    </Button>
  )
}

type FrameOrderButtonsProps = {
  frameName: string
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

export function FrameOrderButtons({
  frameName,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: FrameOrderButtonsProps) {
  const label = frameName.trim() || "frame"

  if (!canMoveUp && !canMoveDown) {
    return null
  }

  return (
    <>
      {canMoveUp ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={frameRowActionClassName}
          aria-label={`Move ${label} up`}
          onClick={(event) => {
            event.stopPropagation()
            onMoveUp()
          }}
        >
          <ChevronUp className="size-3.5" />
        </Button>
      ) : null}
      {canMoveDown ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={frameRowActionClassName}
          aria-label={`Move ${label} down`}
          onClick={(event) => {
            event.stopPropagation()
            onMoveDown()
          }}
        >
          <ChevronDown className="size-3.5" />
        </Button>
      ) : null}
    </>
  )
}

type RemoveFrameButtonProps = {
  frameName: string
  hasElements: boolean
  onRemove: () => void
  className?: string
}

export function RemoveFrameButton({
  frameName,
  hasElements,
  onRemove,
  className,
}: RemoveFrameButtonProps) {
  const [open, setOpen] = useState(false)

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation()

    if (hasElements) {
      setOpen(true)
      return
    }

    onRemove()
  }

  function handleConfirm() {
    onRemove()
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(frameRowActionClassName, className)}
        aria-label={`Remove ${frameName || "page"}`}
        onClick={handleClick}
      >
        <Trash2 className="size-3.5" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {frameName.trim() || "page"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This page has elements on it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
