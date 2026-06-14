import { useRef, type CSSProperties } from "react"
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
  CanvasSettings,
} from "@/features/designer/model/types"
import type { DesignerDispatch } from "@/features/designer/state/use-designer-settings"
import { GradientStopSlider } from "@/features/designer/components/settings/gradient-stop-slider"
import {
  gradientStopsToCss,
  normalizeBackgroundGradient,
} from "@/features/designer/lib/gradient-stops"
import { ColorPickerPanel } from "@workspace/ui/components/settings/color-picker"
import { Button } from "@workspace/ui/components/button"
import { PanelIconTileButton } from "@workspace/ui/components/settings/panel-icon-tile-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { SettingSection } from "@workspace/ui/components/settings/setting-section"
import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { SettingsSelect } from "@workspace/ui/components/settings/settings-select"
import {
  panelIconClassName,
  settingsFieldClassName,
} from "@workspace/ui/components/settings/settings-field-styles"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { normalizeHexColor } from "@workspace/ui/lib/color-utils"
import { cn } from "@workspace/ui/lib/utils"

const backgroundSwatchTriggerClassName = cn(
  settingsFieldClassName,
  "size-7 shrink-0 cursor-pointer rounded-md border border-border/60 p-0.5 transition-colors hover:bg-muted/80"
)

const backgroundPopoverContentClassName = "w-44 gap-2.5 rounded-3xl p-2.5"

const backgroundSummaryFieldClassName = cn(
  settingsFieldClassName,
  "flex h-7 min-w-0 flex-1 items-center px-2.5 text-xs text-foreground"
)

const transparentSwatchStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)",
  backgroundSize: "6px 6px",
  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0",
}

type BackgroundSettingsSectionProps = {
  settings: CanvasSettings
  dispatch: DesignerDispatch
  onImageUpload: (file: File | null) => void
}

export function BackgroundSettingsSection({
  settings,
  dispatch,
  onImageUpload,
}: BackgroundSettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { background } = settings
  const normalizedBackground = normalizeBackgroundGradient(background)

  return (
    <SettingSection title="Background">
      <Popover modal={false}>
        <div className="flex items-center gap-2">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Edit background"
              className={backgroundSwatchTriggerClassName}
            >
              <BackgroundSwatch background={background} />
            </button>
          </PopoverTrigger>
          <BackgroundSummaryField background={background} dispatch={dispatch} />
        </div>
        <PopoverContent
          side="left"
          align="start"
          sideOffset={8}
          className={backgroundPopoverContentClassName}
        >
          <BackgroundTypeToggle
            value={background.type}
            onChange={(value) =>
              dispatch({ type: "set-background-type", value })
            }
          />

          {background.type === "color" ? (
            <ColorPickerPanel
              className="w-full"
              value={background.color}
              onChange={(value) =>
                dispatch({ type: "set-background-color", value })
              }
            />
          ) : null}

          {background.type === "gradient" ? (
            <GradientStopSlider
              stops={normalizedBackground.gradientStops}
              onStopsChange={(value) =>
                dispatch({ type: "set-background-gradient-stops", value })
              }
            />
          ) : null}

          {background.type === "image" ? (
            <ImageBackgroundPopoverContent
              background={background}
              fileInputRef={fileInputRef}
              dispatch={dispatch}
              onImageUpload={onImageUpload}
            />
          ) : null}

          {background.type === "transparent" ? (
            <p className="text-xs text-muted-foreground">
              No background fill on export.
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </SettingSection>
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
    <ToggleGroup
      type="single"
      variant="tile"
      size="icon"
      className="w-full"
      value={value}
      onValueChange={(next) => {
        if (isBackgroundType(next)) {
          onChange(next)
        }
      }}
    >
      <ToggleGroupItem
        value="color"
        size="icon"
        className="flex-1"
        aria-label="Solid color"
      >
        <Palette className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="gradient"
        size="icon"
        className="flex-1"
        aria-label="Gradient"
      >
        <Blend className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="image"
        size="icon"
        className="flex-1"
        aria-label="Image"
      >
        <ImageIcon className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="transparent"
        size="icon"
        className="flex-1"
        aria-label="Transparent"
      >
        <SquareDashed className="size-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function ImageBackgroundPopoverContent({
  background,
  fileInputRef,
  dispatch,
  onImageUpload,
}: {
  background: BackgroundSettings
  fileInputRef: React.RefObject<HTMLInputElement | null>
  dispatch: DesignerDispatch
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
              dispatch({ type: "set-background-fit", value })
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
        className="block size-full rounded-[4px]"
        style={{ backgroundColor: background.color }}
      />
    )
  }

  if (background.type === "gradient") {
    const normalized = normalizeBackgroundGradient(background)

    return (
      <span
        className="block size-full rounded-[4px]"
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
        className="block size-full rounded-[4px]"
        style={transparentSwatchStyle}
      />
    )
  }

  if (background.imageSrc) {
    return (
      <img
        src={background.imageSrc}
        alt=""
        className="block size-full rounded-[4px] object-cover"
      />
    )
  }

  return (
    <span className="flex size-full items-center justify-center rounded-[4px]">
      <ImageIcon className="size-3.5 text-muted-foreground" />
    </span>
  )
}

function BackgroundSummaryField({
  background,
  dispatch,
}: {
  background: BackgroundSettings
  dispatch: DesignerDispatch
}) {
  if (background.type === "color") {
    return (
      <SettingsInput
        type="text"
        value={normalizeHexColor(background.color)}
        aria-label="Background color hex"
        className="h-7 min-w-0 flex-1 font-mono tabular-nums"
        onChange={(event) =>
          dispatch({
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
