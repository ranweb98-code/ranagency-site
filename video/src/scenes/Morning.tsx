import { AbsoluteFill, useCurrentFrame } from "remotion"
import { KineticText } from "../components/KineticText"
import { INK, WHITE } from "../theme"

/** Beat 5 (120 frames). Placeholder until the look is locked: the CRM
 *  dashboard (chips flying in, rows landing hot/cold) is built next. */
export function Morning() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
        <KineticText lines={["בבוקר הם כבר", "ביומן שלך."]} f={f} inAt={20} size={96} color={INK} />
      </div>
    </AbsoluteFill>
  )
}
