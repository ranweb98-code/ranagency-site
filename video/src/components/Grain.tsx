import type { CSSProperties } from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"

/** Film grain over the frame: the texture of the monogram's metal artwork,
 *  carried through the whole ad. Reseeded every other frame so it lives
 *  without boiling. `id` must be unique per instance (it names the filter). */
export function Grain({
  id,
  opacity,
  baseFrequency = 0.9,
  blend = "overlay",
}: {
  id: string
  opacity: number
  baseFrequency?: number
  blend?: CSSProperties["mixBlendMode"]
}) {
  const frame = useCurrentFrame()
  const seed = Math.floor(frame / 2)
  const filterId = `${id}-${seed}`
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: blend, opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={baseFrequency} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </AbsoluteFill>
  )
}
