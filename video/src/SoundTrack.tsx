import { Html5Audio, Sequence, staticFile } from "remotion"

/** The ad's sound design: effects only, no music, no voice. Every cue is
 *  pinned to the frame of the thing it sounds — a notification landing, a
 *  bubble popping, a letter of the wordmark falling into place. The sounds
 *  themselves are synthesized by scripts/build-sfx.py. */

type Sfx =
  | "wake" | "ping-1" | "ping-2" | "ping-3" | "ping-4" | "roll" | "thud" | "rewind" | "curtain"
  | "swish" | "land" | "typing" | "pop" | "success" | "ring" | "air" | "tick" | "hit" | "key"
  | "meter" | "end"

export type Cue = [at: number, sfx: Sfx, volume: number]

// Scene starts (global frames): night 0 · rewind 210 · agents 270 ·
// morning 540 · brand 660 · close 780. Phone conversations start at
// 282 (realtor), 370 (chef) and 458 (dentist); see src/scenes/Agents.tsx.
export const CUES: Cue[] = [
  // 1 · 23:41 — the phone wakes, four messages land, each a step higher.
  [0, "wake", 0.7],
  [8, "ping-1", 0.55],
  [20, "ping-2", 0.55],
  [30, "ping-3", 0.55],
  [38, "ping-4", 0.6],
  // 2 · the loss — the clock rolls to 08:40 and lands; the replies thud in.
  [98, "roll", 0.8],
  [152, "thud", 0.7],
  [166, "thud", 0.6],
  [180, "thud", 0.55],
  // 3 · rewind — sucked back under the curtain, which leaves on the night.
  [210, "rewind", 0.8],
  [211, "curtain", 0.7],
  [246, "curtain", 0.45],
  [262, "land", 0.55],
  // 4 · the agents answer.
  [282, "typing", 0.45], // caption types "וואטסאפ"
  [288, "pop", 0.5],
  [300, "typing", 0.3],
  [314, "pop", 0.55],
  [332, "pop", 0.5],
  [344, "success", 0.6],
  [356, "swish", 0.5],
  [370, "typing", 0.45], // "אינסטגרם"
  [376, "pop", 0.5],
  [388, "typing", 0.3],
  [402, "pop", 0.55],
  [420, "success", 0.6],
  [444, "swish", 0.5],
  [450, "ring", 0.55],
  [458, "typing", 0.45], // "טלפון"
  [466, "pop", 0.4],
  [486, "pop", 0.45],
  [504, "pop", 0.4],
  [516, "success", 0.65],
  // 5 · morning — the white curtain, air, and the leads ticking into place.
  [540, "curtain", 0.55],
  [544, "air", 0.6],
  [570, "tick", 0.6],
  [580, "tick", 0.6],
  [590, "tick", 0.6],
  [600, "tick", 0.55],
  // 6 · "העסק ישן. הסוכן לא." — two hits, then a key per letter.
  [668, "hit", 0.85],
  [700, "hit", 0.85],
  [732, "swish", 0.4],
  [740, "key", 0.6],
  [745, "key", 0.6],
  [750, "key", 0.6],
  [755, "key", 0.6],
  [760, "key", 0.65],
  // 7 · the meter fills; the end card lands and the light crosses it.
  [788, "meter", 0.6],
  [840, "end", 0.85],
  [858, "pop", 0.45],
]

export function SoundTrack({ cues }: { cues: Cue[] }) {
  return (
    <>
      {cues.map(([at, sfx, volume], i) => (
        <Sequence key={i} from={at} layout="none" name={`♪ ${sfx}`}>
          <Html5Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  )
}
