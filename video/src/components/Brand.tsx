import { MONOGRAM, WORDMARK } from "../brand/paths"

type Mark = typeof WORDMARK | typeof MONOGRAM

/** A brand mark whose glyphs animate separately. `progress(i)` gives glyph i
 *  (in reading order, right to left) its own 0→1 entrance. */
function BrandMark({
  mark,
  height,
  color,
  progress,
  rise = 0.18,
}: {
  mark: Mark
  height: number
  color: string
  progress?: (i: number) => number
  rise?: number
}) {
  const width = (height * mark.width) / mark.height
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${mark.width} ${mark.height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {mark.glyphs.map((g, i) => {
        const p = progress ? progress(i) : 1
        return (
          <path
            key={g.id}
            d={g.d}
            fill={color}
            style={{
              opacity: Math.min(1, p * 1.6),
              transform: `translateY(${(1 - p) * mark.height * rise}px)`,
            }}
          />
        )
      })}
    </svg>
  )
}

export function Wordmark(props: { height: number; color: string; progress?: (i: number) => number }) {
  return <BrandMark mark={WORDMARK} {...props} />
}

export function Monogram(props: { height: number; color: string; progress?: (i: number) => number }) {
  return <BrandMark mark={MONOGRAM} {...props} />
}
