import { Sequence, useCurrentFrame } from "remotion"
import { AdFrame, MasterPicture, type AdProps } from "./Ad30"
import { masterFrameAt, remapCues, type Segment } from "./edit"
import { CUES, SoundTrack } from "./SoundTrack"

/** 15s: the same story, faster, without the morning dashboard and the
 *  meter. Segment edges sit on the master's scene boundaries, so every cut
 *  is a scene change rather than a jump inside one. Rates are whole numbers
 *  (1× or 2×): a fractional rate has to round master frames, which stutters. */
export const CUT_15: Segment[] = [
  { at: 0, frames: 90, masterFrom: 0, masterTo: 90 }, // 23:41
  { at: 90, frames: 60, masterFrom: 90, masterTo: 210 }, // the loss, 2×
  { at: 150, frames: 60, masterFrom: 210, masterTo: 270 }, // rewind
  { at: 210, frames: 135, masterFrom: 270, masterTo: 540 }, // three businesses answer, 2×
  { at: 345, frames: 60, masterFrom: 660, masterTo: 780 }, // "העסק ישן. הסוכן לא." + wordmark, 2×
  { at: 405, frames: 45, masterFrom: 840, masterTo: 885 }, // end card
]

/** 6s bumper: the night's messages, one of them answered, the end card.
 *  The opening line is hidden — the cut leaves the night before it could
 *  finish rising. The answer runs a little fast to leave the end card a
 *  full two seconds. */
export const CUT_6: Segment[] = [
  { at: 0, frames: 48, masterFrom: 0, masterTo: 48 },
  { at: 48, frames: 72, masterFrom: 270, masterTo: 356 },
  { at: 120, frames: 60, masterFrom: 840, masterTo: 900 },
]

function Cut({ segments, safeZones, hookHeadline }: AdProps & { segments: Segment[]; hookHeadline?: boolean }) {
  const f = useCurrentFrame()
  const m = Math.round(masterFrameAt(f, segments))
  // Offsetting a Sequence (rather than a Freeze) shows master frame m: its
  // children see f - from = m, and their durations are measured against the
  // offset, so a short cut can still reach master frames past its own length.
  return (
    <AdFrame safeZones={safeZones}>
      <Sequence from={f - m} durationInFrames={900} name={`master @ ${m}`}>
        <MasterPicture hookHeadline={hookHeadline} />
      </Sequence>
      <SoundTrack cues={remapCues(CUES, segments)} />
    </AdFrame>
  )
}

export function Ad15(props: AdProps) {
  return <Cut {...props} segments={CUT_15} />
}

export function Ad6(props: AdProps) {
  return <Cut {...props} segments={CUT_6} hookHeadline={false} />
}
