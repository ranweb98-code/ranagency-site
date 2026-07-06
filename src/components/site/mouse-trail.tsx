"use client"

import { useEffect, useRef } from "react"

const PATH_COUNT = 70
// Overall ribbon thickness multiplier — bump this up for a bolder trail.
const SIZE_SCALE = 2.4
// Slightly different lag per link (instead of one uniform value) breaks the
// even resonance that made the chain look like a repeating sawtooth.
const LAG_MIN = 3
const LAG_MAX = 4
// Hue range matches the site's own blue → violet brand gradient
// (ran-primary ≈ hsl(225) to ran-accent ≈ hsl(260)).
const HUE_START = 225
const HUE_SPAN = 35

// Flowing ribbon that chases the pointer, adapted from
// https://codepen.io/creativeocean/pen/emdagYG. On touch devices (or once
// the pointer has been idle a while) it drifts on its own via slow, eased,
// non-repeating waypoints — a periodic idle path (e.g. plain sin/cos) would
// alias against the chain's own settling delay and look like a self-crossing
// zigzag instead of one flowing curve.
export function MouseTrail() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const svg = svgRef.current
    if (!svg) return

    const paths: SVGPathElement[] = []
    const lags: number[] = []
    const pts: { x: number; y: number }[] = []
    const rect = () => svg.getBoundingClientRect()
    const r0 = rect()

    for (let i = 0; i < PATH_COUNT; i++) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
      path.setAttribute("fill", "none")
      path.setAttribute("stroke-linecap", "round")
      svg.appendChild(path)
      paths.push(path)
      lags.push(LAG_MIN + Math.random() * (LAG_MAX - LAG_MIN))
      pts.push({ x: r0.width / 2, y: r0.height / 2 })
    }

    const target = { x: r0.width / 2, y: r0.height / 2 }
    const pointer = { x: r0.width / 2, y: r0.height / 2 }
    let usingPointer = false
    let idleTimer = 0

    const onPointerMove = (e: PointerEvent) => {
      const r = rect()
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) return
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      usingPointer = true
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        usingPointer = false
      }, 2500)
    }
    window.addEventListener("pointermove", onPointerMove)

    // Idle driver: ease toward a random waypoint, picking a new one every
    // few seconds. Non-periodic on purpose (see comment above).
    let waypoint = { x: r0.width / 2, y: r0.height / 2 }
    let nextWaypointAt = 0
    const pickWaypoint = () => {
      const r = rect()
      const mx = r.width * 0.15
      const my = r.height * 0.15
      waypoint = {
        x: mx + Math.random() * Math.max(1, r.width - mx * 2),
        y: my + Math.random() * Math.max(1, r.height - my * 2),
      }
      nextWaypointAt = performance.now() + 4500 + Math.random() * 2500
    }
    pickWaypoint()

    let raf = 0
    const tick = () => {
      if (!usingPointer && performance.now() > nextWaypointAt) pickWaypoint()
      const drivingPoint = usingPointer ? pointer : waypoint
      target.x += (drivingPoint.x - target.x) * 0.02
      target.y += (drivingPoint.y - target.y) * 0.02
      let next = target
      pts.forEach((pt, i) => {
        const lag = lags[i]
        pt.x += (next.x - pt.x) / lag
        pt.y += (next.y - pt.y) / lag
        if (i > 0) {
          const prev = pts[i - 1]
          const dist = Math.hypot(prev.x - pt.x, prev.y - pt.y)
          const taper = (1 + 3 * Math.sin((i / PATH_COUNT) * Math.PI)) * SIZE_SCALE
          const hue = HUE_START + (i / PATH_COUNT) * HUE_SPAN
          paths[i].setAttribute("d", `M${prev.x},${prev.y} L${pt.x},${pt.y}`)
          paths[i].setAttribute("stroke", `hsl(${hue} 82% 60%)`)
          paths[i].setAttribute("stroke-width", String(taper * Math.min(1, dist / 4)))
          paths[i].setAttribute("opacity", "0.55")
        }
        next = pt
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointerMove)
      window.clearTimeout(idleTimer)
      paths.forEach((path) => path.remove())
    }
  }, [])

  return <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
}
