"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

/** Track = 2× thumb + 4px inset; thumb snaps start/end so inset matches on both sides. */
const switchTrackVariants = cva(
  "peer group/switch relative inline-flex shrink-0 items-center justify-start rounded-full border border-transparent p-0.5 transition-colors outline-none [corner-shape:round] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-[state=checked]:justify-end dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-active-foreground dark:data-checked:bg-active data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-[18px] w-[32px]",
        sm: "h-[16px] w-[28px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none shrink-0 rounded-full bg-background ring-0 [corner-shape:round] dark:group-data-[state=unchecked]/switch:bg-foreground",
  {
    variants: {
      size: {
        default: "size-[14px]",
        sm: "size-[12px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchTrackVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchTrackVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={switchThumbVariants({ size })}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
