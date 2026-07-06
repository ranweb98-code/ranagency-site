"use client"

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react"
import { useRef, type PointerEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

const MAX_TILT = 10 // degrees

// 3D parallax tilt, adapted from the pointer-tracking idea in
// https://codepen.io/thebabydino/pen/YPpqaWM — that pen fakes hover-tracking
// with a pure-CSS grid of `:has()` traps, which only ever reacts to a real
// mouse. Pointer events unify mouse/touch/pen, so the same drag-to-tilt
// gesture works with a finger too (touch-action: pan-y keeps page scrolling
// from being swallowed by the gesture).
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), {
    stiffness: 250,
    damping: 22,
    mass: 0.5,
  })
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), {
    stiffness: 250,
    damping: 22,
    mass: 0.5,
  })
  const glare = useMotionTemplate`radial-gradient(500px circle at ${useTransform(px, [0, 1], ["0%", "100%"])} ${useTransform(py, [0, 1], ["0%", "100%"])}, rgb(255 255 255 / 12%), transparent 65%)`

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    // Measured from the outer (non-rotated) wrapper on purpose — reading
    // bounds from the tilting element itself would feed its own rotated,
    // skewed box back into the next tilt calculation.
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return
    px.set((event.clientX - bounds.left) / bounds.width)
    py.set((event.clientY - bounds.top) / bounds.height)
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerUp={reset}
      onPointerCancel={reset}
      className="h-full"
      style={{ perspective: "1400px", touchAction: "pan-y" }}
    >
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn("relative h-full overflow-hidden", className)}
      >
        {!prefersReducedMotion && (
          <motion.div className="pointer-events-none absolute inset-0" style={{ backgroundImage: glare }} aria-hidden />
        )}
        <div style={{ transform: "translateZ(30px)" }}>{children}</div>
      </motion.div>
    </div>
  )
}
