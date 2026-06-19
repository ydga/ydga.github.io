import { useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { TEXT_LAYER_ALL_FONT_CHOICES } from "@/features/designer/model/text-layer-style"
import { InputGroup } from "@workspace/ui/components/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  settingsControlHeightClassName,
  settingsControlLineHeightClassName,
  settingsInputGroupClasses,
  settingsNumericTextClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import { cn } from "@workspace/ui/lib/utils"

type TextLayerFontFamilyPickerProps = {
  value: string
  onChange: (fontFamily: string) => void
  "aria-label"?: string
}

function labelForValue(
  value: string,
  choiceByValue: Map<string, string>
): string {
  return choiceByValue.get(value) ?? "Custom"
}

export function TextLayerFontFamilyPicker({
  value,
  onChange,
  "aria-label": ariaLabel = "Font",
}: TextLayerFontFamilyPickerProps) {
  const [open, setOpen] = useState(false)

  const choiceByValue = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of TEXT_LAYER_ALL_FONT_CHOICES) {
      m.set(c.value, c.label)
    }
    return m
  }, [])

  const isPreset = choiceByValue.has(value)
  const triggerLabel = labelForValue(value, choiceByValue)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup
        className={settingsInputGroupClasses(
          cn("relative w-full min-w-0 gap-0", settingsControlHeightClassName)
        )}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            data-slot="input-group-control"
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              settingsControlHeightClassName,
              settingsNumericTextClassName,
              settingsControlLineHeightClassName,
              "flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-none border-0 bg-transparent py-0 pr-7 pl-2 text-left shadow-none outline-none focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-muted/60"
            )}
          >
            <span className="min-w-0 truncate">{triggerLabel}</span>
          </button>
        </PopoverTrigger>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
      </InputGroup>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[min(100vw-2rem,20rem)] max-w-[var(--radix-popover-trigger-width)] gap-0 p-0"
      >
        <div
          className="max-h-64 overflow-y-auto overscroll-contain py-1"
          role="listbox"
          aria-label={ariaLabel}
        >
          {TEXT_LAYER_ALL_FONT_CHOICES.map((preset) => {
            const selected = value === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent",
                  selected && "bg-accent/60"
                )}
                onClick={() => {
                  onChange(preset.value)
                  setOpen(false)
                }}
              >
                <span
                  className="min-w-0 flex-1 truncate text-sm leading-tight text-foreground"
                  style={{ fontFamily: preset.value }}
                >
                  {preset.label}
                </span>
                {selected ? (
                  <Check
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
          {!isPreset ? (
            <button
              type="button"
              role="option"
              aria-selected
              className="flex w-full items-center border-t border-border px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent"
              onClick={() => setOpen(false)}
            >
              <span
                className="min-w-0 flex-1 truncate text-sm leading-tight text-foreground"
                style={{ fontFamily: value }}
              >
                Custom
              </span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
