import { useRef } from "react"
import {
  Blend,
  Image as ImageIcon,
  Palette,
  SquareDashed,
  Trash2,
} from "lucide-react"

import type {
  BackgroundFit,
  BackgroundSettings,
  BackgroundType,
} from "@/features/designer/model/types"
import type { BackgroundSettingsAction } from "@/features/designer/lib/background-settings-reducer"
import { GradientStopSlider } from "@/features/designer/components/settings/gradient-stop-slider"
import {
  gradientStopsToCss,
  normalizeBackgroundGradient,
} from "@/features/designer/lib/gradient-stops"
import { transparentSwatchStyle } from "@/features/designer/lib/background-style"
import { ColorPickerPanel } from "@workspace/ui/components/settings/color-picker"
import { Button } from "@workspace/ui/components/button"
import { PanelIconTileButton } from "@workspace/ui/components/settings/panel-icon-tile-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import {
  panelIconClassName,
  settingsColorSwatchTriggerClassName,
  settingsFieldClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import type { SlidingSegmentedTabItem } from "@workspace/ui/components/settings/sliding-segmented-tabs"
import { SlidingSegmentedTabs } from "@workspace/ui/components/settings/sliding-segmented-tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { normalizeHexColor } from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

const backgroundPopoverContentClassName = "w-44 gap-2.5 rounded-3xl p-2.5"

const BACKGROUND_TYPE_ITEMS: SlidingSegmentedTabItem[] = [
  {
    value: "color",
    ariaLabel: "Solid color",
    tooltip: "Color",
    content: <Palette className="size-3.5" aria-hidden />,
  },
  {
    value: "gradient",
    ariaLabel: "Gradient",
    tooltip: "Gradient",
    content: <Blend className="size-3.5" aria-hidden />,
  },
  {
    value: "image",
    ariaLabel: "Image",
    tooltip: "Image",
    content: <ImageIcon className="size-3.5" aria-hidden />,
  },
  {
    value: "transparent",
    ariaLabel: "Transparent",
    tooltip: "Transparent",
    content: <SquareDashed className="size-3.5" aria-hidden />,
  },
]

const backgroundSummaryFieldClassName = cn(
  settingsFieldClassName,
  "flex h-7 min-w-0 flex-1 items-center px-2.5 text-xs text-foreground"
)

type FillBackgroundFieldProps = {
  background: BackgroundSettings
  onAction: (action: BackgroundSettingsAction) => void
  onImageUpload: (file: File | null) => void
  swatchAriaLabel?: string
  transparentHelpText?: string
  className?: string
}

export function FillBackgroundField({
  background,
  onAction,
  onImageUpload,
  swatchAriaLabel = "Edit fill",
  transparentHelpText = "No fill on export.",
  className,
}: FillBackgroundFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const normalizedBackground = normalizeBackgroundGradient(background)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={swatchAriaLabel}
            className={settingsColorSwatchTriggerClassName}
          >
            <BackgroundSwatch background={background} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="left"
          align="start"
          sideOffset={8}
          className={backgroundPopoverContentClassName}
        >
          <BackgroundTypeToggle
            value={background.type}
            onChange={(value) =>
              onAction({ type: "set-background-type", value })
            }
          />

          {background.type === "color" ? (
            <ColorPickerPanel
              className="w-full"
              value={background.color}
              onChange={(value) =>
                onAction({ type: "set-background-color", value })
              }
            />
          ) : null}

          {background.type === "gradient" ? (
            <GradientStopSlider
              stops={normalizedBackground.gradientStops}
              onStopsChange={(value) =>
                onAction({ type: "set-background-gradient-stops", value })
              }
            />
          ) : null}

          {background.type === "image" ? (
            <ImageBackgroundPopoverContent
              background={background}
              fileInputRef={fileInputRef}
              onAction={onAction}
              onImageUpload={onImageUpload}
            />
          ) : null}

          {background.type === "transparent" ? (
            <p className="text-xs text-muted-foreground">
              {transparentHelpText}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>

      <BackgroundSummaryField background={background} onAction={onAction} />
    </div>
  )
}

function BackgroundTypeToggle({
  value,
  onChange,
}: {
  value: BackgroundType
  onChange: (value: BackgroundType) => void
}) {
  return (
    <SlidingSegmentedTabs
      value={value}
      onValueChange={(next) => {
        if (isBackgroundType(next)) {
          onChange(next)
        }
      }}
      items={BACKGROUND_TYPE_ITEMS}
    />
  )
}

function ImageBackgroundPopoverContent({
  background,
  fileInputRef,
  onAction,
  onImageUpload,
}: {
  background: BackgroundSettings
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAction: (action: BackgroundSettingsAction) => void
  onImageUpload: (file: File | null) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={(event) => {
          onImageUpload(event.target.files?.[0] ?? null)
          event.target.value = ""
        }}
      />

      {background.imageSrc ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/70">
          <img
            src={background.imageSrc}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div
          className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30"
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const file = event.dataTransfer.files?.[0]
            if (file?.type.startsWith("image/")) {
              onImageUpload(file)
            }
          }}
        >
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <SettingsSelect
          wrapperClassName="min-w-0 flex-1"
          aria-label="Image fit"
          value={background.fit}
          disabled={!background.imageSrc}
          onChange={(event) => {
            const value = event.target.value
            if (isBackgroundFit(value)) {
              onAction({ type: "set-background-fit", value })
            }
          }}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fit">Fit</option>
          <option value="tile">Tile</option>
        </SettingsSelect>

        <Tooltip>
          <TooltipTrigger asChild>
            <PanelIconTileButton
              type="button"
              aria-label="Remove image"
              disabled={!background.imageSrc}
              onClick={() => onImageUpload(null)}
            >
              <Trash2 className={panelIconClassName} />
            </PanelIconTileButton>
          </TooltipTrigger>
          <TooltipContent side="top">Remove image</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function BackgroundSwatch({ background }: { background: BackgroundSettings }) {
  if (background.type === "color") {
    return (
      <span
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: background.color }}
      />
    )
  }

  if (background.type === "gradient") {
    const normalized = normalizeBackgroundGradient(background)

    return (
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: gradientStopsToCss(
            normalized.gradientStops,
            normalized.gradientAngle
          ),
        }}
      />
    )
  }

  if (background.type === "transparent") {
    return (
      <span
        className="pointer-events-none absolute inset-0"
        style={transparentSwatchStyle}
      />
    )
  }

  if (background.imageSrc) {
    return (
      <img
        src={background.imageSrc}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
    )
  }

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <ImageIcon className="size-3.5 text-muted-foreground" />
    </span>
  )
}

function BackgroundSummaryField({
  background,
  onAction,
}: {
  background: BackgroundSettings
  onAction: (action: BackgroundSettingsAction) => void
}) {
  if (background.type === "color") {
    return (
      <SettingsInput
        type="text"
        value={normalizeHexColor(background.color)}
        aria-label="Fill color hex"
        className="h-7 min-w-0 flex-1 font-mono tabular-nums"
        onChange={(event) =>
          onAction({
            type: "set-background-color",
            value: normalizeHexColor(event.target.value),
          })
        }
      />
    )
  }

  if (background.type === "gradient") {
    const normalized = normalizeBackgroundGradient(background)

    return (
      <div className={backgroundSummaryFieldClassName}>
        <span className="min-w-0 truncate">
          {normalized.gradientStops.length} colors · {normalized.gradientAngle}°
        </span>
      </div>
    )
  }

  if (background.type === "transparent") {
    return (
      <div className={backgroundSummaryFieldClassName}>
        <span className="min-w-0 truncate">Transparent</span>
      </div>
    )
  }

  return (
    <div className={backgroundSummaryFieldClassName}>
      <span className="min-w-0 truncate">
        {background.imageSrc ? "Image" : "No image"}
      </span>
    </div>
  )
}

function isBackgroundType(value: string): value is BackgroundType {
  return (
    value === "color" ||
    value === "gradient" ||
    value === "image" ||
    value === "transparent"
  )
}

function isBackgroundFit(value: string): value is BackgroundFit {
  return (
    value === "cover" ||
    value === "contain" ||
    value === "fit" ||
    value === "tile"
  )
}
