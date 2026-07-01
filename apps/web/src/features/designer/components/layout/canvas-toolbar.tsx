import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import {
  Circle,
  Download,
  Minus,
  MousePointer2,
  Square,
  Triangle,
  Type,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { DesignerUi } from "@/features/designer/state/use-designer-ui"
import type {
  ShapeVariant,
  ToolbarTool,
} from "@/features/designer/model/ui-types"
import { NavIconButton } from "@workspace/ui/components/settings/nav-icon-button"
import {
  SlidingNavIndicator,
  SlidingNavItem,
} from "@workspace/ui/components/settings/sliding-nav-indicator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

const SHAPE_PICKER_OPEN_DELAY_MS = 500
const SHAPE_PICKER_CLOSE_DELAY_MS = 100
const SHAPE_PICKER_NAV_GAP_PX = 6

/** Keep in sync with {@link FloatingChrome} frosted inner `p-1.5`. */
const TOOLBAR_INNER_PADDING_CLASSNAME = "p-1.5"

/** Matches {@link FloatingChrome} frosted inner — keep shape picker visually aligned with main tools. */
const TOOLBAR_CHROME_CLASSNAME =
  "rounded-squircle bg-background/90 p-1.5 shadow-lg backdrop-blur-md"

type ToolbarItem = {
  tool: ToolbarTool
  label: string
  icon: LucideIcon
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { tool: "pointer", label: "Pointer", icon: MousePointer2 },
  { tool: "text", label: "Text", icon: Type },
  { tool: "export", label: "Export", icon: Download },
]

const SHAPE_VARIANTS: Array<{
  variant: ShapeVariant
  label: string
  icon: LucideIcon
}> = [
  { variant: "square", label: "Square", icon: Square },
  { variant: "circle", label: "Circle", icon: Circle },
  { variant: "triangle", label: "Triangle", icon: Triangle },
  { variant: "line", label: "Line", icon: Minus },
]

function shapeVariantMeta(variant: ShapeVariant) {
  return (
    SHAPE_VARIANTS.find((item) => item.variant === variant) ??
    SHAPE_VARIANTS[0]!
  )
}

type CanvasToolbarProps = {
  ui: DesignerUi
}

type ShapeAlternatesPanelProps = {
  ui: DesignerUi
  show: boolean
  anchorTopPx: number | null
  onPointerEnter: () => void
  onPointerLeave: () => void
}

function ShapeAlternatesPanel({
  ui,
  show,
  anchorTopPx,
  onPointerEnter,
  onPointerLeave,
}: ShapeAlternatesPanelProps) {
  const alternates = SHAPE_VARIANTS.filter(
    ({ variant }) => variant !== ui.shapeVariant
  )

  if (anchorTopPx == null) {
    return null
  }

  return (
    <div
      aria-hidden={!show}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={cn(
        "absolute z-20 -translate-y-1/2 transition-opacity duration-150",
        show
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      )}
      style={{
        top: anchorTopPx,
        right: `calc(100% + ${SHAPE_PICKER_NAV_GAP_PX}px)`,
      }}
    >
      <div
        role="listbox"
        aria-label="Other shapes"
        className={cn(
          TOOLBAR_CHROME_CLASSNAME,
          "flex flex-row items-center gap-1"
        )}
      >
        {alternates.map(({ variant, label: itemLabel, icon: Icon }) => (
          <NavIconButton
            key={variant}
            aria-label={itemLabel}
            tabIndex={show ? 0 : -1}
            onClick={() => ui.selectShapeTool(variant)}
          >
            <Icon aria-hidden />
          </NavIconButton>
        ))}
      </div>
    </div>
  )
}

type ShapeToolControlProps = CanvasToolbarProps & {
  shapeItemRef: RefObject<HTMLDivElement | null>
  onPointerEnter: () => void
  onPointerLeave: () => void
}

function ShapeToolControl({
  ui,
  shapeItemRef,
  onPointerEnter,
  onPointerLeave,
}: ShapeToolControlProps) {
  const active = ui.toolbarTool === "shape"
  const { label, icon: ShapeIcon } = shapeVariantMeta(ui.shapeVariant)

  return (
    <div
      ref={shapeItemRef}
      role="group"
      aria-label="Shape tools"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <NavIconButton
        active={active}
        aria-label={label}
        aria-pressed={active}
        aria-haspopup="listbox"
        className={cn(
          active &&
            "text-white hover:bg-transparent hover:text-white [&_svg]:text-white hover:[&_svg]:text-white"
        )}
        onClick={() => ui.selectShapeTool()}
      >
        <ShapeIcon aria-hidden />
      </NavIconButton>
    </div>
  )
}

export function CanvasToolbar({ ui }: CanvasToolbarProps) {
  const shapeToolIndex = 2
  const toolbarContainerRef = useRef<HTMLDivElement>(null)
  const shapeItemRef = useRef<HTMLDivElement>(null)
  const [showAlternates, setShowAlternates] = useState(false)
  const [alternateTopPx, setAlternateTopPx] = useState<number | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const measureAlternateTop = useCallback(() => {
    const shapeEl = shapeItemRef.current
    const containerEl = toolbarContainerRef.current
    if (!shapeEl || !containerEl) {
      return
    }

    const shapeRect = shapeEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    setAlternateTopPx(shapeRect.top - containerRect.top + shapeRect.height / 2)
  }, [])

  useLayoutEffect(() => {
    measureAlternateTop()

    const containerEl = toolbarContainerRef.current
    const shapeEl = shapeItemRef.current
    if (!containerEl) {
      return
    }

    const observer = new ResizeObserver(measureAlternateTop)
    observer.observe(containerEl)
    if (shapeEl) {
      observer.observe(shapeEl)
    }

    return () => observer.disconnect()
  }, [measureAlternateTop, ui.shapeVariant, ui.toolbarTool])

  function handleShapePointerEnter() {
    measureAlternateTop()

    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null
      setShowAlternates(true)
    }, SHAPE_PICKER_OPEN_DELAY_MS)
  }

  function handleShapePointerLeave() {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setShowAlternates(false)
    }, SHAPE_PICKER_CLOSE_DELAY_MS)
  }

  function toolbarActiveIndex(tool: ToolbarTool): number {
    if (tool === "shape") {
      return shapeToolIndex
    }

    const itemIndex = TOOLBAR_ITEMS.findIndex((item) => item.tool === tool)
    if (itemIndex < 0) {
      return -1
    }

    return itemIndex < shapeToolIndex ? itemIndex : itemIndex + 1
  }

  const activeIndex = toolbarActiveIndex(ui.toolbarTool)

  function handleToolClick(tool: ToolbarTool) {
    if (tool === "pointer") {
      ui.selectPointerTool()
      return
    }

    if (tool === "text") {
      ui.selectTextTool()
      return
    }

    ui.selectToolbarTool(tool)
  }

  const beforeShape = TOOLBAR_ITEMS.slice(0, shapeToolIndex)
  const afterShape = TOOLBAR_ITEMS.slice(shapeToolIndex)

  function renderToolbarItem({ tool, label, icon: Icon }: ToolbarItem) {
    const active = ui.toolbarTool === tool

    return (
      <SlidingNavItem key={tool}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavIconButton
              active={active}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                active &&
                  "text-white hover:bg-transparent hover:text-white [&_svg]:text-white hover:[&_svg]:text-white"
              )}
              onClick={() => handleToolClick(tool)}
            >
              <Icon aria-hidden />
            </NavIconButton>
          </TooltipTrigger>
          <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
      </SlidingNavItem>
    )
  }

  return (
    <div
      ref={toolbarContainerRef}
      className={cn(
        "relative -m-1.5 overflow-visible",
        TOOLBAR_INNER_PADDING_CLASSNAME
      )}
    >
      <ShapeAlternatesPanel
        ui={ui}
        show={showAlternates}
        anchorTopPx={alternateTopPx}
        onPointerEnter={handleShapePointerEnter}
        onPointerLeave={handleShapePointerLeave}
      />

      <div
        role="toolbar"
        aria-label="Canvas tools"
        className="flex flex-col gap-2"
      >
        <SlidingNavIndicator
          activeIndex={activeIndex >= 0 ? activeIndex : null}
          variant="primary"
          indicatorClassName="bg-black"
          className="flex flex-col gap-1"
        >
          {beforeShape.map(renderToolbarItem)}

          <SlidingNavItem>
            <ShapeToolControl
              ui={ui}
              shapeItemRef={shapeItemRef}
              onPointerEnter={handleShapePointerEnter}
              onPointerLeave={handleShapePointerLeave}
            />
          </SlidingNavItem>

          {afterShape.map(renderToolbarItem)}
        </SlidingNavIndicator>
      </div>
    </div>
  )
}
