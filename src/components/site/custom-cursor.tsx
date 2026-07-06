"use client"

import { useEffect, useRef } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"

// Magnetic dot cursor with lerp-follow + ring expansion on interactive
// elements, adapted from https://codepen.io/aleksa-rakocevic/pen/JoKKjwd (MIT).
// Desktop-only: needs a fine pointer, and bows out entirely for
// prefers-reduced-motion since the whole point is a physics-y follow animation.
// The component renders nothing at all on touch devices (rather than just
// skipping the animation loop) — otherwise the dot still mounts at its CSS
// default position and just sits there, looking like a stuck cursor.
// Hover targets are detected via event delegation (mouseover/mouseout +
// closest("a, button...")) instead of querying elements once on mount, so it
// keeps working for content that mounts later (mobile menu, modals, etc).
const HOVER_SELECTOR = "a, button, [role='button'], input, textarea, select, summary"

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)")
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const enabled = canHover && !prefersReducedMotion

  useEffect(() => {
    if (!enabled) return

    const dot = dotRef.current
    if (!dot) return

    document.documentElement.classList.add("custom-cursor-active")

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let x = mouseX
    let y = mouseY

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener("pointermove", onPointerMove)

    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(HOVER_SELECTOR)) {
        dot.classList.add("cursor-magnet")
      }
    }
    const onMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null
      if (!related?.closest(HOVER_SELECTOR)) {
        dot.classList.remove("cursor-magnet")
      }
    }
    document.addEventListener("mouseover", onMouseOver)
    document.addEventListener("mouseout", onMouseOut)

    let raf = 0
    const tick = () => {
      x += (mouseX - x) * 0.18
      y += (mouseY - y) * 0.18
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("mouseout", onMouseOut)
      document.documentElement.classList.remove("custom-cursor-active")
    }
  }, [enabled])

  if (!enabled) return null

  return <div ref={dotRef} className="custom-cursor" aria-hidden />
}
