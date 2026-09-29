import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion"
import { Grain } from "./components/Grain"
import { LockScreenStory } from "./components/LockScreenStory"
import { SafeZones } from "./components/SafeZones"
import { FONT_STACK } from "./fonts"
import { Agents } from "./scenes/Agents"
import { BrandLine } from "./scenes/BrandLine"
import { Close } from "./scenes/Close"
import { Morning } from "./scenes/Morning"
import { Rewind } from "./scenes/Rewind"
import { NIGHT } from "./theme"

export type AdProps = { safeZones: boolean }

function Night() {
  return <LockScreenStory f={useCurrentFrame()} />
}

/** The 30s master, beat for beat as in video/STORYBOARD.md. */
export function Ad30({ safeZones }: AdProps) {
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: NIGHT }}>
      <Sequence from={0} durationInFrames={210} name="1–2 · הוק וההפסד">
        <Night />
      </Sequence>
      <Sequence from={210} durationInFrames={60} name="3 · אחורה">
        <Rewind />
      </Sequence>
      <Sequence from={270} durationInFrames={270} name="4 · הסוכן עונה">
        <Agents />
      </Sequence>
      <Sequence from={540} durationInFrames={120} name="5 · הבוקר">
        <Morning />
      </Sequence>
      <Sequence from={660} durationInFrames={120} name="6 · המותג">
        <BrandLine />
      </Sequence>
      <Sequence from={780} durationInFrames={120} name="7 · הצעה וסיום">
        <Close />
      </Sequence>
      <Grain id="film-grain" opacity={0.06} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
