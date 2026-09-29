import { AbsoluteFill, useCurrentFrame } from "remotion"
import { Monogram } from "../components/Brand"
import { MetalSurface } from "../components/MetalSurface"
import { HAIRLINE, INK, MUTED, SURFACE, WHITE, ease } from "../theme"

/** Beat 7 (120 frames): the founding-seats meter from the site, then the
 *  end card — the monogram on its grainy metal, the offer, the action. */

const SPOTS_TAKEN = 6 // keep in sync with SPOTS_TAKEN in src/components/site/founding-offer-section.tsx
const SPOTS_TOTAL = 10
const END_AT = 60

function Meter({ f }: { f: number }) {
  const fill = ease(f, 8, 26) * (SPOTS_TAKEN / SPOTS_TOTAL)
  return (
    <AbsoluteFill style={{ background: WHITE, alignItems: "center", paddingTop: 420 }}>
      <div style={{ fontSize: 34, fontWeight: 700, color: MUTED, letterSpacing: "0.14em", opacity: ease(f, 0, 10) }}>
        מחיר מייסדים
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 120,
          fontWeight: 800,
          color: INK,
          letterSpacing: "-0.035em",
          lineHeight: 1.06,
          opacity: ease(f, 2, 12),
          transform: `translateY(${(1 - ease(f, 2, 14)) * 30}px)`,
        }}
      >
        נותרו {SPOTS_TOTAL - SPOTS_TAKEN} מקומות
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 70,
          width: 880,
          height: 64,
          borderRadius: 999,
          background: SURFACE,
          border: `2px solid ${HAIRLINE}`,
          overflow: "hidden",
        }}
      >
        {/* Anchored to the right edge and growing left, the direction the
            page reads — the same meter as the site's founding section. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            insetInlineStart: 0,
            width: `${fill * 100}%`,
            borderRadius: 999,
            backgroundColor: INK,
            backgroundImage:
              "linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.18) 75%, transparent 75%, transparent)",
            backgroundSize: "40px 40px",
            backgroundPosition: `${-(f % 27) * (40 / 27)}px 0`,
          }}
        />
      </div>
      <div style={{ marginTop: 26, fontSize: 32, fontWeight: 500, color: MUTED, opacity: ease(f, 20, 10) }}>
        {SPOTS_TAKEN} מתוך {SPOTS_TOTAL} מקומות נתפסו
      </div>
    </AbsoluteFill>
  )
}

function EndCard({ f }: { f: number }) {
  const cta = ease(f, 18, 16)
  return (
    <AbsoluteFill>
      <MetalSurface sweep={ease(f, 22, 44)} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 420 }}>
        <Monogram height={400} color={INK} progress={(i) => ease(f, i * 4, 18)} />
        <div
          style={{
            marginTop: 70,
            fontSize: 38,
            fontWeight: 500,
            color: INK,
            opacity: 0.82 * ease(f, 12, 12),
          }}
        >
          מחיר מייסדים · נותרו {SPOTS_TOTAL - SPOTS_TAKEN} מקומות
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
          style={{ marginTop: 30, fontSize: 40, fontWeight: 500, color: INK, opacity: ease(f, 24, 12) }}
        >
          napuch.co.il
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function Close() {
  const f = useCurrentFrame()
  const cross = ease(f, END_AT - 4, 10)
  return (
    <AbsoluteFill>
      {cross < 1 && <Meter f={f} />}
      {f >= END_AT - 4 && (
        <AbsoluteFill style={{ opacity: cross }}>
          <EndCard f={f - END_AT} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
