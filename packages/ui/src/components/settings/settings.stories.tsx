import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import {
  Image,
  Maximize2,
  Minimize2,
  Palette,
  RotateCw,
  Ruler,
} from "lucide-react"

import { SettingsInput } from "@workspace/ui/components/settings/settings-input"
import { cn } from "@workspace/ui/lib/utils"
import { ProTooltipProvider } from "../tooltip"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group"
import { DimensionField } from "./dimension-field"
import { ColorPickerField } from "./color-picker"
import { FramePresetCard } from "./frame-preset-card"
import { PresetCategoryTabs, type PresetCategory } from "./preset-category-tabs"
import { SettingControl } from "./setting-control"
import { SettingSection } from "./setting-section"
import { NavIconButton } from "./nav-icon-button"
import { PanelIconTileButton } from "./panel-icon-tile-button"
import {
  panelIconClassName,
  panelPaddingClassName,
} from "./settings-field-styles"
import { SlidingNavIndicator, SlidingNavItem } from "./sliding-nav-indicator"

const meta = {
  title: "Settings/Primitives",
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <ProTooltipProvider>
        <div
          className={cn(
            "w-[var(--panel-width)] rounded-2xl border border-border bg-background",
            panelPaddingClassName
          )}
        >
          <Story />
        </div>
      </ProTooltipProvider>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SettingSectionStory: Story = {
  name: "SettingSection",
  render: () => (
    <SettingSection title="Dimensions">
      <p className="text-xs text-muted-foreground">
        Compact section header with 14px base scale.
      </p>
    </SettingSection>
  ),
}

export const DimensionFieldStory: Story = {
  name: "DimensionField",
  render: function Render() {
    const [width, setWidth] = useState(1080)
    const [height, setHeight] = useState(1350)

    return (
      <DimensionField
        width={width}
        height={height}
        unit="px"
        onWidthChange={setWidth}
        onHeightChange={setHeight}
      />
    )
  },
}

export const ColorPickerFieldStory: Story = {
  name: "ColorPickerField",
  render: function Render() {
    const [color, setColor] = useState("#C45C3E")

    return <ColorPickerField value={color} onChange={setColor} />
  },
}

export const IconToggles: Story = {
  render: function Render() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <SettingControl label="Background type">
            <ToggleGroup
              type="single"
              variant="tile"
              size="icon"
              defaultValue="color"
            >
              <ToggleGroupItem value="color" aria-label="Solid color">
                <Palette className="size-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="image" aria-label="Image">
                <Image className="size-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </SettingControl>

          <SettingControl label="Fit: cover">
            <ToggleGroup
              type="single"
              variant="tile"
              size="icon"
              defaultValue="cover"
            >
              <ToggleGroupItem value="cover" aria-label="Cover">
                <Maximize2 className="size-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="contain" aria-label="Contain">
                <Minimize2 className="size-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </SettingControl>
        </div>
      </div>
    )
  },
}

export const PresetCategoryTabsStory: Story = {
  name: "PresetCategoryTabs",
  render: function Render() {
    const [category, setCategory] = useState<PresetCategory>("screen")

    return <PresetCategoryTabs value={category} onValueChange={setCategory} />
  },
}

export const SlidingNavIndicatorStory: Story = {
  name: "SlidingNavIndicator",
  render: function Render() {
    const [activeIndex, setActiveIndex] = useState(0)

    return (
      <SlidingNavIndicator
        activeIndex={activeIndex}
        variant="primary"
        className="rounded-squircle inline-flex flex-col gap-1 border border-border bg-background p-1"
      >
        {["Frame", "Layers", "Export"].map((label, index) => (
          <SlidingNavItem key={label}>
            <NavIconButton
              active={activeIndex === index}
              aria-label={label}
              onClick={() => setActiveIndex(index)}
            >
              {label.slice(0, 1)}
            </NavIconButton>
          </SlidingNavItem>
        ))}
      </SlidingNavIndicator>
    )
  },
}

export const FramePresetGrid: Story = {
  render: function Render() {
    const [category, setCategory] = useState<PresetCategory>("screen")
    const [activeId, setActiveId] = useState("portrait")

    const screenPresets = [
      { id: "post", label: "Post", description: "1080 × 1080", aspectRatio: 1 },
      {
        id: "portrait",
        label: "Portrait",
        description: "1080 × 1350",
        aspectRatio: 1080 / 1350,
      },
      {
        id: "landscape",
        label: "Landscape",
        description: "1080 × 566",
        aspectRatio: 1080 / 566,
      },
      {
        id: "story",
        label: "Story",
        description: "1080 × 1920",
        aspectRatio: 1080 / 1920,
      },
    ]

    const printPresets = [
      {
        id: "letter",
        label: "Letter",
        description: "21.6 × 27.9 cm",
        aspectRatio: 21.59 / 27.94,
      },
      {
        id: "a4",
        label: "A4",
        description: "21 × 29.7 cm",
        aspectRatio: 21 / 29.7,
      },
      {
        id: "a5",
        label: "A5",
        description: "14.8 × 21 cm",
        aspectRatio: 14.8 / 21,
      },
      {
        id: "4x6",
        label: "4×6",
        description: "10.2 × 15.2 cm",
        aspectRatio: 10.16 / 15.24,
      },
    ]

    const presets = category === "screen" ? screenPresets : printPresets

    return (
      <SettingSection title="Presets">
        <PresetCategoryTabs value={category} onValueChange={setCategory} />
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <FramePresetCard
              key={preset.id}
              label={preset.label}
              description={preset.description}
              aspectRatio={preset.aspectRatio}
              active={activeId === preset.id}
              onSelect={() => setActiveId(preset.id)}
            />
          ))}
        </div>
      </SettingSection>
    )
  },
}

export const CompactInputs: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <SettingControl label="Bleed per edge">
        <SettingsInput
          type="number"
          defaultValue={0.3}
          step={0.01}
          aria-label="Bleed per edge"
          placeholder="0.3"
          className="h-7 w-20 font-mono tabular-nums"
        />
      </SettingControl>
      <SettingControl label="Safe inset">
        <div className="flex items-center gap-1.5">
          <SettingsInput
            type="number"
            defaultValue={0.3}
            step={0.01}
            aria-label="Safe inset"
            placeholder="0.3"
            className="h-7 w-20 font-mono tabular-nums"
          />
          <Ruler className="size-3.5 text-muted-foreground" aria-hidden />
        </div>
      </SettingControl>
    </div>
  ),
}

export const FullCanvasPanel: Story = {
  render: function Render() {
    const [width, setWidth] = useState(1080)
    const [height, setHeight] = useState(1350)
    const [category, setCategory] = useState<PresetCategory>("screen")
    const [activeId, setActiveId] = useState("portrait")

    const presets = [
      { id: "post", label: "Post", description: "1080 × 1080", aspectRatio: 1 },
      {
        id: "portrait",
        label: "Portrait",
        description: "1080 × 1350",
        aspectRatio: 1080 / 1350,
      },
      {
        id: "landscape",
        label: "Landscape",
        description: "1080 × 566",
        aspectRatio: 1080 / 566,
      },
      {
        id: "story",
        label: "Story",
        description: "1080 × 1920",
        aspectRatio: 1080 / 1920,
      },
    ]

    return (
      <div className="flex flex-col gap-5">
        <SettingSection title="Dimensions">
          <div className="flex min-w-0 items-center gap-2">
            <DimensionField
              width={width}
              height={height}
              unit="px"
              onWidthChange={setWidth}
              onHeightChange={setHeight}
            />

            <SettingControl label="Rotate">
              <PanelIconTileButton
                type="button"
                aria-label="Rotate canvas"
                disabled={width === height}
                onClick={() => {
                  setWidth(height)
                  setHeight(width)
                }}
              >
                <RotateCw className={panelIconClassName} />
              </PanelIconTileButton>
            </SettingControl>
          </div>
        </SettingSection>

        <SettingSection title="Presets">
          <PresetCategoryTabs value={category} onValueChange={setCategory} />
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <FramePresetCard
                key={preset.id}
                label={preset.label}
                description={preset.description}
                aspectRatio={preset.aspectRatio}
                active={activeId === preset.id}
                onSelect={() => setActiveId(preset.id)}
              />
            ))}
          </div>
        </SettingSection>
      </div>
    )
  },
}
