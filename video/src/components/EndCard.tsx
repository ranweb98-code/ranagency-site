import { AbsoluteFill } from "remotion"
import { FOUNDING, INK, WHITE, clamp01, ease } from "../theme"
import { Monogram, Wordmark } from "./Brand"
import { MetalSurface } from "./MetalSurface"

/** The end card the ads close on: the brand on its grainy metal, the
 *  founding offer and the action. Three entries:
 *  - `rise`: the monogram rises in glyph by glyph (23:41).
 *  - `stamp`: the monogram is pressed onto the metal in one blow (חם או קר).
 *  - `brand`: the full lockup, monogram over wordmark, rising glyph by glyph
 *    on the frames of the brand sting (public/sfx/brand/sting-1.wav). The
 *    follow-up ads all close on this one, so they end the same way, on the
 *    same sound. */

/** Frames from the start of the stamp entry to the blow — where its sound goes. */
export const STAMP_LAND = 3

export function EndCard({ f, entry = "rise" }: { f: number; entry?: "rise" | "stamp" | "brand" }) {
  const brand = entry === "brand"
  const cta = ease(f, brand ? 26 : 18, 16)
  // The press accelerates down (ease-in) and gives a little on impact.
  const fall = clamp01(f / STAMP_LAND) ** 2
  const give = f >= STAMP_LAND && f < STAMP_LAND + 6 ? 0.035 * Math.sin(((f - STAMP_LAND) / 6) * Math.PI) : 0
  const stampScale = entry === "stamp" ? 1.6 - 0.6 * fall - give : 1
  const stampOpacity = entry === "stamp" ? clamp01(0.2 + f / STAMP_LAND) : 1
  return (
    <AbsoluteFill>
      <MetalSurface sweep={ease(f, brand ? 28 : 22, 44)} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: brand ? 360 : 420 }}>
        <div style={{ transform: `scale(${stampScale})`, opacity: stampOpacity }}>
          <Monogram
            height={brand ? 320 : 400}
            color={INK}
            progress={entry === "stamp" ? undefined : (i) => ease(f, i * 4, 18)}
          />
        </div>
        {brand && (
          <div style={{ marginTop: 44 }}>
            <Wordmark height={118} color={INK} progress={(i) => ease(f, 12 + i * 2.5, 16)} />
          </div>
        )}
        <div
          style={{
            marginTop: brand ? 54 : 70,
            fontSize: 38,
            fontWeight: 500,
            color: INK,
            opacity: 0.82 * ease(f, brand ? 22 : 12, 12),
          }}
        >
          מחיר מייסדים · נותרו {FOUNDING.total - FOUNDING.taken} מקומות
        </div>
        <div
          style={{
            marginTop: 30,
            padding: "30px 76px",
            borderRadius: 999,
            background: INK,
            color: WHITE,
            fontSize: 50,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            boxShadow: "0 30px 60px -30px rgba(0, 0, 0, 0.7)",
            opacity: cta,
            transform: `scale(${0.9 + 0.1 * cta})`,
          }}
        >
          קבעו ייעוץ חינם
        </div>
        <div
          dir="ltr"
          style={{ marginTop: 30, fontSize: 40, fontWeight: 500, color: INK, opacity: ease(f, brand ? 32 : 24, 12) }}
        >
          napuch.co.il
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
