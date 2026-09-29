import type { CSSProperties } from "react"
import { AbsoluteFill } from "remotion"
import { SAFE } from "../theme"

/** Review overlay (props: {"safeZones": true}): hatches the strips that
 *  Instagram's own UI covers on a Reels ad. Never part of a delivery render. */
export function SafeZones() {
  const hatch =
    "repeating-linear-gradient(45deg, rgba(255, 40, 90, 0.28) 0 14px, rgba(255, 40, 90, 0.08) 14px 28px)"
  const band = (style: CSSProperties) => <div style={{ position: "absolute", background: hatch, ...style }} />
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {band({ top: 0, left: 0, right: 0, height: SAFE.top })}
      {band({ top: SAFE.bottom, left: 0, right: 0, bottom: 0 })}
      {band({ top: SAFE.top, bottom: 1920 - SAFE.bottom, left: 0, width: SAFE.side })}
      {band({ top: SAFE.top, bottom: 1920 - SAFE.bottom, right: 0, width: SAFE.side })}
    </AbsoluteFill>
  )
}
