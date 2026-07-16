import type { CanvasSettings } from "@/features/designer/model/types"

export const DEFAULT_DPI = 300
export const MAX_PIXEL_DIMENSION = 8192
export const MAX_CM_DIMENSION = 70
export const PREVIEW_MAX_CSS = 720

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  width: 800,
  height: 600,
  unit: "px",
  dpi: 300,
  pixelScale: 1,
  background: {
    type: "color",
    color: "#ffffff",
    gradientStops: [
      { id: "gradient-stop-start", color: "#ffffff", position: 0 },
      { id: "gradient-stop-end", color: "#000000", position: 100 },
    ],
    gradientEnd: "#000000",
    gradientAngle: 180,
    gradientStartX: 15,
    gradientStartY: 50,
    gradientEndX: 85,
    gradientEndY: 50,
    imageSrc: null,
    fit: "cover",
  },
  print: {
    bleedEnabled: false,
    bleed: 0.3,
    safeEnabled: false,
    safeInset: 0.3,
  },
  guides: {
    showTrim: false,
    showBleed: false,
    showSafe: false,
    showCenter: false,
    showThirds: false,
  },
  export: {
    screenFormat: "png",
    burnIn: {
      trim: false,
      bleed: false,
      safe: false,
      center: false,
      thirds: false,
    },
  },
}
