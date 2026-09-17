"use client"

import { useEffect, useRef, useState } from "react"

import { useMediaQuery } from "@/hooks/use-media-query"

const TYPE_SPEED_MS = 90
const DELETE_SPEED_MS = 45
const HOLD_MS = 1400

type Phase = "holding" | "deleting" | "typing"

export function TypewriterWord({
  words,
  className,
  srLabel,
}: {
  words: string[]
  className?: string
  srLabel?: string
}) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  // Deterministic first render (always words[0], fully typed) — identical on
  // server and client, so there's no hydration mismatch.
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState(words[0] ?? "")
  const [phase, setPhase] = useState<Phase>("holding")
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (prefersReducedMotion || words.length <= 1) return

    if (phase === "holding") {
      timeoutRef.current = window.setTimeout(() => setPhase("deleting"), HOLD_MS)
    } else if (phase === "deleting") {
      timeoutRef.current = window.setTimeout(() => {
        if (text.length > 0) {
          setText(text.slice(0, -1))
        } else {
          setWordIndex((i) => (i + 1) % words.length)
          setPhase("typing")
        }
      }, DELETE_SPEED_MS)
    } else {
      timeoutRef.current = window.setTimeout(() => {
        const next = words[wordIndex] ?? ""
        if (text.length < next.length) {
          setText(next.slice(0, text.length + 1))
        } else {
          setPhase("holding")
        }
      }, TYPE_SPEED_MS)
    }

    return () => window.clearTimeout(timeoutRef.current)
  }, [phase, text, wordIndex, prefersReducedMotion, words])

  return (
    <span className="relative inline-block">
      <span className={className} aria-hidden={!prefersReducedMotion}>
        {text}
        {!prefersReducedMotion && <span className="typewriter-cursor" aria-hidden />}
      </span>
      {!prefersReducedMotion && <span className="sr-only">{srLabel ?? words.join(", ")}</span>}
    </span>
  )
}
