"use client"

import { ReactLenis } from "lenis/react"
import type { ReactNode } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"

export function LenisProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
