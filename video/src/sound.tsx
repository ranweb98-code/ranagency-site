import { Html5Audio, Sequence, staticFile } from "remotion"
import kits from "./sfx-kits.json"

/** Cue sheets for the follow-up ads. Each ad draws on its own kit of
 *  synthesized sounds (scripts/build-sfx-kits.py). A sound that plays more
 *  than once is handed out variant by variant, so no hit is heard
 *  identically twice. */

type Kits = typeof kits
export type Kit = keyof Kits

export type Cue = { at: number; src: string; volume: number; dur?: number }

export function cueSheet<K extends Kit>(kit: K) {
  const used = new Map<string, number>()
  const cues: Cue[] = []
  /** Play `sound` from the kit on frame `at`. */
  const sfx = (at: number, sound: keyof Kits[K] & string, volume: number, dur?: number) => {
    const count = (kits[kit] as Record<string, number>)[sound]
    const n = used.get(sound) ?? 0
    if (n >= count) throw new Error(`sfx/${kit}/${sound}: all ${count} variants are used; add more in build-sfx-kits.py`)
    used.set(sound, n + 1)
    cues.push({ at, src: `sfx/${kit}/${sound}-${n + 1}.wav`, volume, dur })
  }
  /** Any other file under public/, e.g. a voice line. */
  const file = (at: number, src: string, volume: number) => cues.push({ at, src, volume })
  return { sfx, file, cues }
}

export function Track({ cues }: { cues: Cue[] }) {
  return (
    <>
      {cues.map(({ at, src, volume, dur }, i) => (
        <Sequence key={i} from={at} durationInFrames={dur} layout="none" name={`♪ ${src.split("/").pop()}`}>
          <Html5Audio src={staticFile(src)} volume={volume} />
        </Sequence>
      ))}
    </>
  )
}
