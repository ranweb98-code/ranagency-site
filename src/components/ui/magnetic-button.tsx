"use client"

import { motion, useMotionValue, useSpring } from "motion/react"
import { useRef, type PointerEvent, type ReactNode } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"

export function MagneticButton({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const hasFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)")
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const enabled = hasFinePointer && !prefersReducedMotion

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.5 })

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return
    const relativeX = event.clientX - (bounds.left + bounds.width / 2)
    const relativeY = event.clientY - (bounds.top + bounds.height / 2)
    x.set(Math.max(-12, Math.min(12, relativeX * 0.35)))
    y.set(Math.max(-12, Math.min(12, relativeY * 0.35)))
  }

  const handlePointerLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={enabled ? { x: springX, y: springY } : undefined}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}
