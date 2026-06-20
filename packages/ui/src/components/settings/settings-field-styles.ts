import { cn } from "@workspace/ui/lib/utils"

export const settingsControlHeightClassName = "h-7"
export const settingsControlLineHeightClassName = "leading-4"
export const settingsNumericTextClassName = "settings-numeric"
export const settingsLabelClassName =
  "text-xs font-medium text-muted-foreground"

/** Square label cell (Z, W, H) centered in h-7 controls. */
export const settingsInlineLabelAddonClassName = "size-7 shrink-0 !p-0"

export const settingsInlineLabelClassName = cn(
  settingsLabelClassName,
  settingsControlLineHeightClassName,
  "inline-flex size-7 items-center justify-center"
)

export const settingsFieldClassName =
  "border-0 bg-muted shadow-none focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-muted/80"

/**
 * Color swatch button: same height as settings inputs (`h-7`), same corner
 * radius as {@link Input} (`rounded-4xl`), subtle 1px border at 10% opacity.
 */
export const settingsColorSwatchTriggerClassName = cn(
  "relative inline-flex h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-4xl border border-foreground/10 bg-transparent p-0 transition-colors outline-none hover:bg-muted/80 focus-visible:border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-muted/40"
)

export const settingsNumberFieldClassName =
  "appearance-textfield [-moz-appearance:textfield] cursor-ew-resize [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"

export const settingsInputGroupClassName =
  "border-0 bg-muted shadow-none items-center dark:bg-muted/80"

/** Context panel icon tiles — lock, close, export actions. */
export const panelIconTileClassName = "size-7 shrink-0 rounded-squircle"

export const panelIconClassName = "size-3.5"

export const panelPaddingClassName = "p-[var(--panel-padding)]"

export const panelPaddingXClassName = "px-[var(--panel-padding)]"

export const panelTitleClassName =
  "flex h-7 min-w-0 items-center truncate font-heading text-base font-medium leading-none text-foreground"

export const panelHeaderClassName = cn(
  "flex shrink-0 items-center justify-between gap-3 border-b border-border/30 py-5",
  panelPaddingXClassName
)

export const panelScrollContentClassName = cn(
  panelPaddingXClassName,
  "pt-[var(--panel-padding)]"
)

export const panelSectionClassName = "flex flex-col divide-y divide-border/30"

export const panelBodyClassName = "flex min-h-0 flex-1 flex-col"

export const panelStickyFooterClassName = "panel-sticky-footer"

export const panelCtaClassName = "h-11 w-full text-sm"

export function settingsFieldClasses(className?: string) {
  return cn(settingsFieldClassName, className)
}

export function settingsInputGroupClasses(className?: string) {
  return cn(settingsInputGroupClassName, className)
}
