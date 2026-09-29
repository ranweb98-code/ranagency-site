import type { CSSProperties } from "react"
import { EASE_OUT, clamp01 } from "../theme"

/** Headline type that rises word by word out of a mask, in reading order —
 *  right to left, because the flex rows inherit the ad's RTL direction.
 *  `f` is the caller's frame, so a scene can scrub or reverse it. */
export function KineticText({
  lines,
  f,
  inAt,
  outAt,
  size,
  color,
  weight = 800,
  stagger = 3,
  dur = 18,
  style,
}: {
  lines: string[]
  f: number
  inAt: number
  outAt?: number
  size: number
  color: string
  weight?: number
  stagger?: number
  dur?: number
  style?: CSSProperties
}) {
  const out = outAt === undefined ? 0 : EASE_OUT(clamp01((f - outAt) / 12))
  let index = 0
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: "-0.035em",
        lineHeight: 1.06,
        opacity: 1 - out,
        transform: `translateY(${-out * size * 0.35}px)`,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", columnGap: "0.24em" }}>
          {line.split(" ").map((word) => {
            const i = index++
            const p = EASE_OUT(clamp01((f - inAt - i * stagger) / dur))
            return (
              <span
                key={i}
                style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.14em", marginBottom: "-0.14em" }}
              >
                <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 108}%)` }}>{word}</span>
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
