import { cn } from "@workspace/ui/lib/utils"

type OrientationIconProps = {
  orientation: "portrait" | "landscape"
  className?: string
}

export function OrientationIcon({
  orientation,
  className,
}: OrientationIconProps) {
  const isPortrait = orientation === "portrait"

  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("size-3.5 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x={isPortrait ? 4.5 : 2.5}
        y={isPortrait ? 2.5 : 4.5}
        width={isPortrait ? 7 : 11}
        height={isPortrait ? 11 : 7}
        rx="1.25"
        className="stroke-current"
        strokeWidth="1.25"
      />
    </svg>
  )
}
