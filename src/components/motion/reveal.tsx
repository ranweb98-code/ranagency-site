"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

const REVEAL_TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

// Opacity and a rise only. These used to blur in as well (`filter: blur(6px)` to
// `blur(0px)`), which cost twice: a blur animation can't run on the compositor,
// so every revealed element, FAQ cards and consultation card included, was
// re-rasterised each frame the first time it scrolled into view; and motion
// leaves `filter: blur(0px)` behind when it finishes, so ~40 elements on the
// page kept their own offscreen render surface for good. Opacity and transform
// stay on the compositor and leave nothing behind.

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...REVEAL_TRANSITION, delay }}
    >
      {children}
    </motion.div>
  )
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
      }}
    >
      {children}
    </motion.div>
  )
}
