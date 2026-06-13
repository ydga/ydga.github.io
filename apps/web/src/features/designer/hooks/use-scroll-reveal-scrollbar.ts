import { useEffect, type RefObject } from "react"

const SCROLLBAR_HIDE_DELAY_MS = 800

export function useScrollRevealScrollbar(
  scrollRef: RefObject<HTMLElement | null>,
  className = "is-scrolling"
) {
  useEffect(() => {
    const element = scrollRef.current
    if (!element) {
      return
    }

    let hideTimeout: ReturnType<typeof setTimeout> | undefined

    function revealScrollbar() {
      element?.classList.add(className)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        element?.classList.remove(className)
      }, SCROLLBAR_HIDE_DELAY_MS)
    }

    element.addEventListener("scroll", revealScrollbar, { passive: true })

    return () => {
      element.removeEventListener("scroll", revealScrollbar)
      clearTimeout(hideTimeout)
      element.classList.remove(className)
    }
  }, [scrollRef, className])
}
