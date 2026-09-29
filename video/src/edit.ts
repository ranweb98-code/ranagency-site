/** A cutdown as a time map over the 30s master: each segment plays a stretch
 *  of the master (masterFrom → masterTo) starting at cut frame `at`, at
 *  whatever rate fits it into `frames`. Cutdowns therefore inherit every fix
 *  made to the master, and their sound is remapped by the same map. */

export interface Segment {
  at: number
  frames: number
  masterFrom: number
  masterTo: number
}

export function totalFrames(segments: Segment[]) {
  const last = segments[segments.length - 1]
  return last.at + last.frames
}

export function masterFrameAt(f: number, segments: Segment[]) {
  const s = segments.find((seg) => f >= seg.at && f < seg.at + seg.frames) ?? segments[segments.length - 1]
  const rate = (s.masterTo - s.masterFrom) / s.frames
  return s.masterFrom + Math.min(s.frames, f - s.at) * rate
}

/** Master cue frames → cut frames. Cues in stretches the cut skips drop out. */
export function remapCues<T extends [number, ...unknown[]]>(cues: T[], segments: Segment[]): T[] {
  return cues.flatMap((cue) => {
    const s = segments.find((seg) => cue[0] >= seg.masterFrom && cue[0] < seg.masterTo)
    if (!s) return []
    const rate = (s.masterTo - s.masterFrom) / s.frames
    return [[Math.round(s.at + (cue[0] - s.masterFrom) / rate), ...cue.slice(1)] as T]
  })
}
