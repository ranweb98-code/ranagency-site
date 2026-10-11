"use client"

import { useEffect, useRef, type ElementType, type ReactNode, type RefObject } from "react"

const MIN_SPEED = 26 // px per second, for short strips
const MAX_SPEED = 90
const CROSS_SECONDS = 12 // a long strip is sped up so it still crosses in about this long
const HOLD_MS = 1300 // rest at each end
const IDLE_MS = 5000 // after the person touches it, leave it alone this long

/**
 * A strip that scrolls sideways on a phone is easy to miss: the cards are cut
 * off at the edge and nothing says they move. This drifts it slowly back and
 * forth so the motion itself shows that there is more, and stops the moment a
 * finger, wheel or key touches it (resuming from wherever they left it).
 *
 * It only runs while the strip is actually wider than its box and on screen,
 * so on a desktop, where everything fits, it does nothing. Still under reduced
 * motion. The scroll position is kept as a float: setting `scrollLeft` to
 * 0.4px a frame would be rounded away and never move.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let last = 0
    let pos = 0
    let direction = 1
    let holdUntil = 0
    let pausedUntil = 0
    let visible = false
    let running = false

    const rtl = () => getComputedStyle(el).direction === "rtl"
    // In RTL the browser counts scrollLeft from 0 down to a negative number.
    const read = () => (rtl() ? -el.scrollLeft : el.scrollLeft)
    const write = (value: number) => {
      el.scrollLeft = rtl() ? -value : value
    }

    const setSnap = (on: boolean) => {
      // Mandatory snapping would fight every programmatic step.
      el.style.scrollSnapType = on ? "none" : ""
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(64, now - last) / 1000
      last = now
      if (!visible || document.hidden) return

      const max = el.scrollWidth - el.clientWidth
      if (max < 8) return setSnap(false)

      if (now < pausedUntil) {
        if (running) {
          running = false
          setSnap(false)
        }
        return
      }
      if (!running) {
        running = true
        setSnap(true)
        pos = read() // continue from where the person left it
        direction = pos > max / 2 ? -1 : 1
      }
      if (now < holdUntil) return

      pos += direction * Math.min(MAX_SPEED, Math.max(MIN_SPEED, max / CROSS_SECONDS)) * dt
      if (pos >= max) {
        pos = max
        direction = -1
        holdUntil = now + HOLD_MS
      } else if (pos <= 0) {
        pos = 0
        direction = 1
        holdUntil = now + HOLD_MS
      }
      write(pos)
    }

    const pause = () => {
      pausedUntil = performance.now() + IDLE_MS
    }
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
      setSnap(false)
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
