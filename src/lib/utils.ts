import { clsx, type ClassValue } from "clsx"
import type { PointerEvent } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Positions the .cta-glow / .nav-pill-glare shine (see globals.css) at the
// cursor. Shared because the same tracked-highlight technique is used on
// every solid CTA button, not just one.
export function handleGlareMove(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty("--glare-x", `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty("--glare-y", `${event.clientY - rect.top}px`)
}
