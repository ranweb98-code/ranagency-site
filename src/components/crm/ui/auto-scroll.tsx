"use client"

import { useEffect, useRef, type ElementType, type ReactNode, type RefObject } from "react"

const MIN_SPEED = 6 // px per second, for short strips
const MAX_SPEED = 17
const CROSS_SECONDS = 52 // a long strip is sped up so it still crosses in about this long
const HOLD_MS = 1800 // rest at each end
const RAMP_MS = 900 // speed eases up from rest after each hold
const EDGE_EASE = 90 // px before an end over which it eases to a stop
const IDLE_MS = 5000 // after the person touches it, leave it alone this long

/**
 * A strip that scrolls sideways on a phone is easy to miss: the cards are cut
 * off at the edge and nothing says they move. This drifts it slowly back and
 * forth so the motion itself shows that there is more, and stops the moment a
 * finger, wheel or key touches it (resuming from wherever they left it).
 *
 * The drift is a transform, not `scrollLeft`: a phone rounds the scroll
 * position to whole device pixels, so at a few pixels a second it advances in
 * visible steps. A transform moves in sub-pixel amounts on the GPU, which is
 * what makes it glide. While it runs the real scroll position rests at the
 * start and the children are shifted by `--drift` (see `[data-drifting]` in
 * globals.css); the moment a person touches the strip the offset is committed
 * to `scrollLeft` and the transform is cleared, so their drag carries on from
 * exactly where the drift was. Speed also eases in after each rest and eases
 * out into each end, rather than starting and stopping at full pace.
 *
 * It only runs while the strip is actually wider than its box and on screen,
 * so on a desktop, where everything fits, it does nothing. Still under reduced
 * motion.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let last = 0
    let pos = 0 // how far along the strip, in px, as a float
    let direction = 1
    let holdUntil = 0
    let pausedUntil = 0
    let ramp = 0 // 0 at rest, 1 at full pace
    let visible = false
    let running = false
    let stoppedAt = 0
    let snapTimer = 0

    const rtl = () => getComputedStyle(el).direction === "rtl"
    // In RTL the browser counts scrollLeft from 0 down to a negative number.
    const read = () => (rtl() ? -el.scrollLeft : el.scrollLeft)
    const write = (value: number) => {
      el.scrollLeft = rtl() ? -value : value
    }
    const show = () => el.style.setProperty("--drift", `${rtl() ? pos : -pos}px`)

    // Snapping stays off after a hand-over, until the person's own scroll
    // settles: turning it back on at once would pull the strip to the nearest
    // card and read as a jump (the drift rests between cards).
    const restoreSnap = () => {
      window.clearTimeout(snapTimer)
      el.style.scrollSnapType = ""
    }
    const onScroll = () => {
      if (running || el.style.scrollSnapType !== "none" || performance.now() - stoppedAt < 120) return
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(restoreSnap, 140)
    }

    const start = () => {
      window.clearTimeout(snapTimer)
      running = true
      pos = read() // continue from where the person left it
      direction = pos > (el.scrollWidth - el.clientWidth) / 2 ? -1 : 1
      ramp = 0
      // Mandatory snapping would fight the reset below.
      el.style.scrollSnapType = "none"
      write(0)
      el.dataset.drifting = ""
      show()
    }

    const stop = () => {
      if (!running) return
      running = false
      write(pos)
      delete el.dataset.drifting
      el.style.removeProperty("--drift")
      stoppedAt = performance.now()
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(64, now - last) / 1000
      last = now
      if (!visible || document.hidden) return

      const max = el.scrollWidth - el.clientWidth
      if (max < 8) return stop()

      if (now < pausedUntil) return stop()
      if (!running) {
        start()
        holdUntil = 0
      }
      if (now < holdUntil) return

      ramp = Math.min(1, ramp + (dt * 1000) / RAMP_MS)
      const dist = direction > 0 ? max - pos : pos
      const edge = Math.min(1, Math.max(0.12, dist / EDGE_EASE))
      const pace = Math.min(MAX_SPEED, Math.max(MIN_SPEED, max / CROSS_SECONDS))
      // Smoothstep both ramps, so the pace has no corners.
      const eased = ramp * ramp * (3 - 2 * ramp) * (edge * edge * (3 - 2 * edge))
      pos += direction * pace * eased * dt
      if (pos >= max) {
        pos = max
        direction = -1
        holdUntil = now + HOLD_MS
        ramp = 0
      } else if (pos <= 0) {
        pos = 0
        direction = 1
        holdUntil = now + HOLD_MS
        ramp = 0
      }
      show()
    }

    // Stop synchronously, inside the event, so the drag that follows starts
    // from the committed scroll position and not from a shifted transform.
    const pause = () => {
      stop()
      pausedUntil = performance.now() + IDLE_MS
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    const events = ["pointerdown", "touchstart", "wheel", "keydown"] as const
    for (const name of events) el.addEventListener(name, pause, { passive: true })

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(el)

    frame = requestAnimationFrame((now) => {
      last = now
      tick(now)
    })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      for (const name of events) el.removeEventListener(name, pause)
      el.removeEventListener("scroll", onScroll)
      stop()
      restoreSnap()
    }
  }, [ref])
}

/** A plain wrapper for rows that are server-rendered or otherwise cannot hold the hook. */
export function AutoScrollRow({ as: Tag = "div", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useAutoScroll(ref)
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
