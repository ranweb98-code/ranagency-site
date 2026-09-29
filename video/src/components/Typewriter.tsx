/** The site's hero typewriter (src/components/ui/typewriter-word.tsx):
 *  a word typed in, held, deleted, and the next typed in its place, with a
 *  solid bar for a cursor. Each word here is a channel and is set in that
 *  channel's colour — the one place the ad lets colour into its type. */

export interface TypedWord {
  word: string
  color: string
  /** Frame the typing starts. */
  from: number
  /** Frame the deleting starts (omit for the last word). */
  to?: number
}

const TYPE_FRAMES = 2 // per letter
const DELETE_FRAMES = 1

export function Typewriter({ words, f, cursorColor }: { words: TypedWord[]; f: number; cursorColor: string }) {
  const current = [...words].reverse().find((w) => f >= w.from) ?? words[0]
  const letters = Array.from(current.word)
  let shown = Math.min(letters.length, Math.max(0, Math.floor((f - current.from) / TYPE_FRAMES)))
  if (current.to !== undefined && f >= current.to) {
    shown = Math.max(0, letters.length - Math.floor((f - current.to) / DELETE_FRAMES))
  }
  // Solid while typing, blinking once the word is at rest — like the site.
  const typing = shown < letters.length && f >= current.from
  const blinkOn = typing || Math.floor(f / 15) % 2 === 0
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline" }}>
      <span style={{ color: current.color }}>{letters.slice(0, shown).join("")}</span>
      <span
        style={{
          display: "inline-block",
          width: "0.09em",
          minWidth: 6,
          height: "0.82em",
          marginInlineStart: "0.08em",
          alignSelf: "center",
          borderRadius: 3,
          background: cursorColor,
          opacity: blinkOn ? 1 : 0,
        }}
      />
    </span>
  )
}
