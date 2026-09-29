import { AbsoluteFill, useCurrentFrame } from "remotion"
import { Wordmark } from "../components/Brand"
import { KineticText } from "../components/KineticText"
import { INK, WHITE, ease } from "../theme"

/** Beat 6 (120 frames): the line, then the wordmark building itself letter
 *  by letter in reading order, then the promise. */
export function BrandLine() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0 }}>
        <KineticText lines={["העסק ישן."]} f={f} inAt={8} outAt={72} size={132} color={INK} />
        <KineticText lines={["הסוכן לא."]} f={f} inAt={40} outAt={72} size={132} color={INK} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 560 }}>
        <Wordmark height={210} color={INK} progress={(i) => ease(f, 80 + i * 5, 14)} />
        <div
          style={{
            marginTop: 64,
            fontSize: 58,
            fontWeight: 700,
            color: INK,
            letterSpacing: "-0.02em",
            opacity: ease(f, 104, 12),
            transform: `translateY(${(1 - ease(f, 104, 12)) * 20}px)`,
          }}
        >
          אף לקוח לא הולך לאיבוד.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
