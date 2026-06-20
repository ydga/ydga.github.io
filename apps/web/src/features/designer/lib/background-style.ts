import type { CSSProperties } from "react"

import type { BackgroundSettings } from "@/features/designer/model/types"
import {
  gradientStopsToCss,
  normalizeBackgroundGradient,
} from "@/features/designer/lib/gradient-stops"

export const transparentSwatchStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)",
  backgroundSize: "6px 6px",
  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0",
}

export function backgroundSettingsToStyle(
  background: BackgroundSettings
): CSSProperties {
  if (background.type === "color") {
    return { backgroundColor: background.color }
  }

  if (background.type === "gradient") {
    const normalized = normalizeBackgroundGradient(background)

    return {
      background: gradientStopsToCss(
        normalized.gradientStops,
        normalized.gradientAngle
      ),
    }
  }

  if (background.type === "transparent") {
    return { backgroundColor: "transparent" }
  }

  if (!background.imageSrc) {
    return { backgroundColor: background.color }
  }

  const base: CSSProperties = {
    backgroundImage: `url(${background.imageSrc})`,
    backgroundPosition: "center",
  }

  switch (background.fit) {
    case "fit":
      return {
        ...base,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }
    case "tile":
      return {
        ...base,
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      }
    case "contain":
      return {
        ...base,
        backgroundColor: background.color,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }
    case "cover":
    default:
      return {
        ...base,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }
  }
}
