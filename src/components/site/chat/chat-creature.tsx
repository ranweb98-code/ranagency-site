"use client"

import { useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export type CreatureMood = "idle" | "thinking" | "talking"

/** Points the eyes at the cursor by writing two CSS variables straight onto the
 *  element, so following the pointer costs no re-render. */
function useEyeTracking(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const dx = event.clientX - (rect.left + rect.width / 2)
        const dy = event.clientY - (rect.top + rect.height / 2)
        const distance = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, distance / 160)
        el.style.setProperty("--lx", String((dx / distance) * reach))
        el.style.setProperty("--ly", String((dy / distance) * reach))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
    }
  }, [ref, enabled])
}

/**
 * The assistant: an ink-black blob that slowly changes shape, with two small
 * eyes that blink and follow the cursor. Nothing else on it. The size is
 * whatever the caller gives it (`size-7`, `size-11`); the eyes scale with it.
 * Moods: thinking lifts the eyes and wobbles it, talking makes the eyes pulse.
 * Still under reduced motion.
 */
export function ChatCreature({ mood = "idle", className }: { mood?: CreatureMood; className?: string }) {
  const blob = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  useEyeTracking(blob, !reduced && mood === "idle")

  const eyeClass = cn("block h-[30%] w-[10%] rounded-full bg-current", !reduced && (mood === "talking" ? "chat-eye-talk" : "chat-eye-blink"))

  return (
    <span
      ref={blob}
      aria-hidden
      data-mood={mood}
      className={cn("chat-blob relative inline-flex shrink-0 items-center justify-center bg-ran-text-on-light text-white", !reduced && "chat-blob-morph", className)}
      style={{ ["--lx" as string]: 0, ["--ly" as string]: 0 }}
    >
      <span
        className="flex h-full w-full items-center justify-center gap-[17%]"
        style={{
          transform: mood === "thinking" ? "translateY(-16%)" : "translate(calc(var(--lx) * 10%), calc(var(--ly) * 10%))",
          transition: "transform 0.16s ease-out",
        }}
      >
        <span className={eyeClass} />
        <span className={eyeClass} />
      </span>
    </span>
  )
}
