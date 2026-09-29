import { AbsoluteFill, useCurrentFrame } from "remotion"
import { CURTAIN_EDGE, LiquidCurtain } from "../components/LiquidCurtain"
import { LockScreenStory, NIGHT_HOLD } from "../components/LockScreenStory"
import { Wordmark } from "../components/Brand"
import { CURTAIN_EASE, ON_DARK, WIDTH, clamp01 } from "../theme"

/** Beat 3 (60 frames). The site's curtain crosses the frame; while it comes
 *  in, the morning plays backwards on the part it hasn't reached yet, and
 *  once it covers everything the night is back underneath. RTL text on the
 *  sheet is revealed right to left, in step with the sheet — it reads as the
 *  curtain arrives. */

const IN = 22 // frames, the site's 0.75s sweep
const HOLD = 14
const OUT = 22
const OFF = WIDTH + CURTAIN_EDGE

export function sheetX(r: number) {
  if (r < IN) return OFF * (1 - CURTAIN_EASE(clamp01(r / IN)))
  if (r < IN + HOLD) return 0
  return -OFF * CURTAIN_EASE(clamp01((r - IN - HOLD) / OUT))
}

export function Rewind() {
  const r = useCurrentFrame()
  // Underneath: the morning unwinding (210 → 96 runs the replies and the
  // clock back), then the night, held, once the sheet has it covered.
  const f = r < IN ? 210 - (210 - 96) * clamp01(r / IN) : NIGHT_HOLD
  return (
    <AbsoluteFill>
      <LockScreenStory f={f} headlines={r < IN} />
      <LiquidCurtain x={sheetX(r)} frame={r}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 400 }}>
          <div style={{ fontSize: 124, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            אותו לילה.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 18 }}>
            <span style={{ fontSize: 124, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.035em" }}>עם</span>
            <div style={{ marginTop: 8 }}>
              <Wordmark height={150} color={ON_DARK} />
            </div>
          </div>
        </AbsoluteFill>
      </LiquidCurtain>
    </AbsoluteFill>
  )
}
