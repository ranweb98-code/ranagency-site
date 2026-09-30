import type { CSSProperties, ReactNode } from "react"
import { AbsoluteFill, spring } from "remotion"
import { EASE_OUT, FPS, HEIGHT, WHITE, WIDTH, clamp01 } from "./theme"

/** The shared effects of the follow-up ads: flash, shake, slam, zoom punch,
 *  glitch, whip and ripple. Each is a pure function of the frame, so every
 *  hit lands on the exact frame of its sound in the cue sheet. */

/** Deterministic noise in [0, 1): the same frame always shakes the same way. */
export const rand = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Strength of the latest hit still ringing: 1 on its frame, easing to 0 over `dur`. */
export function decay(f: number, hits: readonly number[], dur: number) {
  let v = 0
  for (const at of hits) {
    const d = f - at
    if (d >= 0 && d < dur) v = Math.max(v, (1 - d / dur) ** 2)
  }
  return v
}

/** A white frame on each hit that falls off over a few frames: energy on a
 *  cut, and it hides the cut. */
export function Flash({
  f,
  hits,
  dur = 7,
  color = WHITE,
  max = 0.95,
}: {
  f: number
  hits: readonly number[]
  dur?: number
  color?: string
  max?: number
}) {
  const v = decay(f, hits, dur)
  if (v <= 0) return null
  return <AbsoluteFill style={{ background: color, opacity: max * v }} />
}

/** Camera shake: jitter that dies out after each hit. */
export function shake(f: number, hits: readonly number[], amp = 16, dur = 12) {
  const v = decay(f, hits, dur)
  if (v <= 0) return "none"
  const x = (rand(f * 3.1) - 0.5) * 2 * amp * v
  const y = (rand(f * 5.7 + 11) - 0.5) * 2 * amp * v
  const r = (rand(f * 7.3 + 29) - 0.5) * 1.4 * v
  return `translate(${x}px, ${y}px) rotate(${r}deg)`
}

export function Shake({
  f,
  hits,
  amp,
  dur,
  children,
}: {
  f: number
  hits: readonly number[]
  amp?: number
  dur?: number
  children: ReactNode
}) {
  return <AbsoluteFill style={{ transform: shake(f, hits, amp, dur) }}>{children}</AbsoluteFill>
}

/** Zoom punch: the scale jumps on the hit and settles back. */
export function punch(f: number, hits: readonly number[], amount = 0.1, dur = 12) {
  let s = 0
  for (const at of hits) {
    const d = f - at
    if (d < 0 || d >= dur) continue
    s = Math.max(s, Math.min(1, (d + 1) / 2) * (1 - d / dur) ** 2)
  }
  return 1 + amount * s
}

/** Frames from a slam's start to its landing — where its sound goes. */
export const SLAM_LAND = 2

/** Slam: the words arrive oversized and blurred and snap to size, landing
 *  SLAM_LAND frames after `at` and compressing a touch past it. */
export function slam(f: number, at: number, from = 2.1): CSSProperties {
  const d = f - at
  if (d < 0) return { opacity: 0 }
  const p = spring({ frame: d, fps: FPS, config: { damping: 22, stiffness: 800, mass: 0.5 } })
  const scale = p <= 1 ? from + (1 - from) * p : 1 - (p - 1) * 0.6
  const blur = Math.max(0, (1 - p) * 16)
  return {
    opacity: clamp01(0.3 + d / 2),
    transform: `scale(${scale})`,
    filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
  }
}

export function Slam({
  f,
  at,
  from,
  style,
  children,
}: {
  f: number
  at: number
  from?: number
  style?: CSSProperties
  children: ReactNode
}) {
  return <div style={{ ...style, ...slam(f, at, from) }}>{children}</div>
}

// Colour matrices that keep one side of an RGB split. Dark scenes add the
// halves back with `screen`; light scenes, where the paper is white, keep the
// other channels at full and recombine with `multiply`.
const SPLIT = {
  dark: {
    a: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    b: "0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0",
    blend: "screen",
    paper: "#000",
  },
  light: {
    a: "1 0 0 0 0  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0",
    b: "0 0 0 0 1  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0",
    blend: "multiply",
    paper: "#fff",
  },
} as const

/** Glitch: for `dur` frames the picture tears into horizontal slices that
 *  jump sideways, and each slice splits into red and cyan. The slices are
 *  re-cut every two frames. */
export function Glitch({
  f,
  at,
  dur,
  id,
  mode = "dark",
  strength = 1,
  paper,
  children,
}: {
  f: number
  at: number
  dur: number
  id: string
  mode?: keyof typeof SPLIT
  strength?: number
  /** What shows through the tears; transparent lets the scene below show. */
  paper?: string
  children: ReactNode
}) {
  const d = f - at
  if (d < 0 || d >= dur) return <AbsoluteFill>{children}</AbsoluteFill>
  const m = { ...SPLIT[mode], paper: paper ?? SPLIT[mode].paper }
  const step = Math.floor(f / 2)
  const k = strength * (0.55 + 0.45 * Math.sin((d / dur) * Math.PI))
  const split = 16 * k
  const cuts = [0, ...Array.from({ length: 7 }, (_, i) => rand(step * 13.7 + i * 2.3)).sort(), 1]
  return (
    <AbsoluteFill style={{ background: m.paper }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={`${id}-a`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={m.a} />
          </filter>
          <filter id={`${id}-b`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={m.b} />
          </filter>
        </defs>
      </svg>
      {cuts.slice(0, -1).map((y0, i) => {
        const y1 = cuts[i + 1]
        const jumps = rand(step * 3.3 + i * 5.1) > 0.4
        const dx = (rand(step * 7.9 + i * 3.7) - 0.5) * 2 * (jumps ? 110 : 12) * k
        return (
          <AbsoluteFill
            key={i}
            style={{
              clipPath: `inset(${y0 * 100}% 0 ${(1 - y1) * 100}% 0)`,
              transform: `translateX(${dx}px)`,
              isolation: "isolate",
              background: m.paper,
            }}
          >
            <AbsoluteFill style={{ filter: `url(#${id}-a)`, transform: `translateX(${-split}px)` }}>{children}</AbsoluteFill>
            <AbsoluteFill
              style={{ filter: `url(#${id}-b)`, transform: `translateX(${split}px)`, mixBlendMode: m.blend }}
            >
              {children}
            </AbsoluteFill>
          </AbsoluteFill>
        )
      })}
    </AbsoluteFill>
  )
}

/** A horizontal motion blur of `amount` px, applied as `filter: url(#id)`. */
export function MotionBlur({ id, amount }: { id: string; amount: number }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="-50%" y="0" width="200%" height="100%">
          <feGaussianBlur stdDeviation={`${Math.max(0, amount)} 0`} />
        </filter>
      </defs>
    </svg>
  )
}

// A sharp in-out: slow off the mark, most of the distance in the middle.
const whipCurve = (p: number) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2)

/** Whip pan over `dur` frames from `at`: the outgoing scene flies off to the
 *  left and the next one arrives from the right, the way the ad reads, both
 *  smeared by the speed. */
export function Whip({
  f,
  at,
  dur = 10,
  id,
  from,
  to,
}: {
  f: number
  at: number
  dur?: number
  id: string
  from: ReactNode
  to: ReactNode
}) {
  const p = clamp01((f - at) / dur)
  if (p <= 0) return <AbsoluteFill>{from}</AbsoluteFill>
  if (p >= 1) return <AbsoluteFill>{to}</AbsoluteFill>
  const e = whipCurve(p)
  const speed = (whipCurve(Math.min(1, p + 0.02)) - whipCurve(Math.max(0, p - 0.02))) / 0.04
  const blur = Math.min(90, speed * 26)
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <MotionBlur id={id} amount={blur} />
      <AbsoluteFill style={{ transform: `translateX(${-e * WIDTH}px)`, filter: `url(#${id})` }}>{from}</AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${(1 - e) * WIDTH}px)`, filter: `url(#${id})` }}>{to}</AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Rings of light spreading from a point on each hit — a phone ringing, a
 *  stamp landing. */
export function Ripple({
  f,
  hits,
  x,
  y,
  color,
  size = 900,
  dur = 30,
}: {
  f: number
  hits: readonly number[]
  x: number
  y: number
  color: string
  size?: number
  dur?: number
}) {
  return (
    <>
      {hits.flatMap((at) =>
        [0, 6].map((lag) => {
          const p = (f - at - lag) / dur
          if (p < 0 || p >= 1) return null
          const r = EASE_OUT(p) * size
          return (
            <div
              key={`${at}-${lag}`}
              style={{
                position: "absolute",
                left: x - r / 2,
                top: y - r / 2,
                width: r,
                height: r,
                borderRadius: 999,
                border: `${6 * (1 - p) + 1}px solid ${color}`,
                opacity: (1 - p) * (lag ? 0.5 : 0.9),
                boxShadow: `0 0 ${40 * (1 - p)}px ${color}`,
              }}
            />
          )
        }),
      )}
    </>
  )
}

/** Horizontal scanlines and a soft vignette, for screens and terminals. */
export function Scanlines({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) 2px, transparent 2px, transparent 6px)",
        opacity,
        height: HEIGHT,
      }}
    />
  )
}
