"use client"

import { useEffect, useState } from "react"
import { useLenis } from "lenis/react"

/* Mirrors the keyframes in globals.css: 0.75s sweeping in, held to 1.1s,
   0.75s sweeping out. The extra buffer keeps the element in the DOM until
   the last frame has painted, so it is never yanked mid-sweep. */
const CURTAIN_TOTAL_MS = 1950

/* Shared with the inline script in src/app/layout.tsx — change both. */
const SESSION_KEY = "napuch:curtain-seen"

/**
 * The intro curtain: a black sheet with a rippling liquid edge that sweeps
 * across the viewport from right to left and carries on off the far side,
 * leaving the page revealed behind it.
 *
 * The motion itself lives in CSS (see `.liquid-curtain` in globals.css), not
 * in `motion/react`. This is the first thing every visitor sees, and a
 * JS-driven overlay only moves once React has hydrated — a slow bundle, a
 * dropped chunk or a runtime error would leave the site sealed behind a black
 * screen. Keyframes start at first paint and finish either way; React is left
 * with the parts that genuinely need it.
 */
export function CurtainLoader() {
  const [isLifted, setIsLifted] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    if (isLifted) return

    const root = document.documentElement
    /* A repeat visit and a reduced-motion preference are both already handled
       in CSS — the curtain is never painted — so all that is left for those
       two is to drop the element on the next tick. */
    const plays =
      root.dataset.curtain !== "skip" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!plays) {
      const skipTimer = window.setTimeout(() => setIsLifted(true), 0)
      return () => window.clearTimeout(skipTimer)
    }

    try {
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      /* Private browsing can refuse the write; the curtain simply plays
         again on the next page load rather than breaking. */
    }

    /* The keyframes started at first paint, which on a slow connection can be
       a long way before hydration gets here. Asking the running animation how
       far along it is — rather than counting from this moment — is what keeps
       the scroll lock from being clamped on after the curtain has already
       swept off, and survives this effect re-running when `useLenis` resolves. */
    const elapsed = document
      .querySelector(".liquid-curtain-sheet")
      ?.getAnimations()[0]?.currentTime
    const remaining = Math.max(
      0,
      CURTAIN_TOTAL_MS - (typeof elapsed === "number" ? elapsed : 0)
    )

    if (remaining > 0) {
      root.classList.add("curtain-active")
      lenis?.stop()
    }

    const timer = window.setTimeout(() => setIsLifted(true), remaining)

    return () => {
      window.clearTimeout(timer)
      root.classList.remove("curtain-active")
      lenis?.start()
    }
  }, [isLifted, lenis])

  if (isLifted) return null

  return (
    <div className="liquid-curtain" aria-hidden="true">
      <div className="liquid-curtain-sheet" />
    </div>
  )
}
