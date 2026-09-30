import { Check } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { EndCard, STAMP_LAND } from "../components/EndCard"
import { Grain } from "../components/Grain"
import { SafeZones } from "../components/SafeZones"
import { FONT_STACK } from "../fonts"
import { Flash, SLAM_LAND, Slam, punch, shake } from "../fx"
import { Track, cueSheet } from "../sound"
import { CHANNEL, INK, MUTED, WHITE, clamp01, ease, type Channel } from "../theme"

/** "חם או קר" — the whole system as a machine. Three pipes, one per
 *  channel, pour inquiries onto a belt; a press stamps each one hot or
 *  cold; the hot ones slide into the week, the cold into follow-up; and the
 *  machine turns out to be the CRM. Flat, inked, on grainy paper. */

const PAPER = "#eeede8"
const LINE = 5
const DROP = `10px 12px 0 ${INK}`

// ── timeline ───────────────────────────────────────────────────────────────
const PIPES: { channel: Channel; x: number; text: string; at: number }[] = [
  // Left to right, so each card lands clear of the one the belt carries past.
  { channel: "instagram", x: 250, text: "סתם שואלת 🙂", at: 10 },
  { channel: "phone", x: 540, text: "אפשר תור לבדיקה מחר?", at: 24 },
  { channel: "whatsapp", x: 830, text: "כמה עולה?", at: 38 },
]
const FALL = 12
const BELT_SPEED = 6
const TITLE = [100, 136]
const STAMP_AT = 184
const STAMP_EVERY = 56
const SORT = 412
const SORT_TITLES = [416, 446]
const LAUNCH = [476, 504, 532, 560]
const DASH = 604
const END = 756
export const HOT_OR_COLD_FRAMES = 900

type Lead = { name: string; channel: Channel; text: string; hot: boolean; slot?: [day: number, time: string] }
const LEADS: Lead[] = [
  { name: "רונית", channel: "phone", text: "אפשר תור לבדיקה מחר?", hot: true, slot: [0, "10:30"] },
  { name: "דנה", channel: "instagram", text: "איזה יפה! אולי פעם 🙂", hot: false },
  { name: "אבי", channel: "whatsapp", text: "פנוי ביום ב׳ בערב? רוצה לקבוע", hot: true, slot: [1, "18:00"] },
  { name: "נועה", channel: "instagram", text: "כמה עולה? אפשר השבוע?", hot: true, slot: [2, "12:00"] },
]
const stampStart = (k: number) => STAMP_AT + k * STAMP_EVERY
const IMPACT = 32 // frames into a card's turn under the press
// Launch order into the week and the tray: the hot ones first, then Dana.
const LAUNCH_ORDER = [0, 2, 3, 1]

// ── sound ──────────────────────────────────────────────────────────────────
const { sfx, cues } = cueSheet("factory")
sfx(0, "conveyor", 0.8, TITLE[0] - 4)
for (const p of PIPES) sfx(p.at, "pipe", 0.7)
for (const p of PIPES) sfx(p.at + FALL, "gate", 0.35)
for (const at of TITLE) sfx(at + SLAM_LAND, "metal", 0.85)
sfx(STAMP_AT - 4, "belt", 0.7, SORT - STAMP_AT + 4)
LEADS.forEach((_, k) => {
  const s = stampStart(k)
  sfx(s + 12, "scan", 0.5)
  sfx(s + IMPACT, "stamp", 0.95)
  sfx(s + IMPACT + 1, "flash", 0.5)
  sfx(s + IMPACT + 6, "air", 0.55)
})
for (const at of SORT_TITLES) sfx(at + SLAM_LAND, "metal", 0.7)
LAUNCH_ORDER.forEach((k, i) => {
  sfx(LAUNCH[i], "gate", 0.6)
  if (LEADS[k].hot) sfx(LAUNCH[i] + 14, "ding", 0.6)
  else sfx(LAUNCH[i] + 6, "tray", 0.7)
})
sfx(DASH - 6, "winddown", 0.7)
for (let r = 0; r < 4; r++) sfx(DASH + 30 + r * 12, "gate", 0.45)
sfx(END + STAMP_LAND, "final", 1)

// ── pieces ─────────────────────────────────────────────────────────────────

function ChannelTag({ channel, size, name }: { channel: Channel; size: number; name?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.4, fontSize: size, fontWeight: 700, color: MUTED }}>
      <div style={{ width: size * 0.62, height: size * 0.62, borderRadius: 999, background: CHANNEL[channel].color, border: `3px solid ${INK}` }} />
      {name ? `${name} · ` : ""}
      {CHANNEL[channel].label}
    </div>
  )
}

function Card({ channel, name, text, width, style, children }: { channel: Channel; name?: string; text: string; width: number; style?: CSSProperties; children?: ReactNode }) {
  const u = width / 300
  return (
    <div
      style={{
        position: "absolute",
        width,
        padding: `${18 * u}px ${22 * u}px`,
        borderRadius: 22 * u,
        background: WHITE,
        border: `${LINE}px solid ${INK}`,
        boxShadow: `${8 * u}px ${10 * u}px 0 ${INK}`,
        ...style,
      }}
    >
      <ChannelTag channel={channel} name={name} size={22 * u} />
      <div style={{ marginTop: 8 * u, fontSize: (width < 400 ? 38 : 32) * u, fontWeight: 800, color: INK, lineHeight: 1.18 }}>{text}</div>
      {children}
    </div>
  )
}

function Paper({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <AbsoluteFill style={{ background: PAPER, ...style }}>{children}</AbsoluteFill>
}

function Belt({ f, top, speed }: { f: number; top: number; speed: number }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top,
          left: 30,
          right: 30,
          height: 80,
          borderRadius: 40,
          background: INK,
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,0.18) 46px 52px)`,
          backgroundPosition: `${-f * speed}px 0`,
          boxShadow: DROP,
        }}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", top: top + 94, left: 70 + i * 118, width: 44, height: 44, borderRadius: 999, border: `${LINE}px solid ${INK}`, background: PAPER, transform: `rotate(${-f * speed * 2}deg)` }}>
          <div style={{ position: "absolute", top: 14, left: -2, right: -2, height: 5, background: INK }} />
        </div>
      ))}
    </>
  )
}

// ── 1 · the pipes ──────────────────────────────────────────────────────────

const BELT_TOP = 930

function Pipes({ f }: { f: number }) {
  return (
    <Paper>
      {PIPES.map((p) => {
        const out = f >= p.at && f < p.at + 6 ? 1 - (f - p.at) / 6 : 0 // the mouth puffs as a card leaves
        return (
          <div key={p.channel} style={{ position: "absolute", left: p.x - 80, top: -20, width: 160 }}>
            <div style={{ height: 520, background: WHITE, border: `${LINE}px solid ${INK}`, borderTop: "none", boxShadow: DROP }} />
            <div style={{ position: "absolute", top: 430, left: -30, right: -30, height: 76, borderRadius: 14, background: CHANNEL[p.channel].color, border: `${LINE}px solid ${INK}`, transform: `scaleX(${1 + out * 0.08})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: WHITE }}>
              {CHANNEL[p.channel].label}
            </div>
          </div>
        )
      })}
      <Belt f={f} top={BELT_TOP} speed={BELT_SPEED} />
      {PIPES.map((p) => {
        if (f < p.at) return null
        const d = f - p.at
        const fall = clamp01(d / FALL) ** 2
        const land = p.at + FALL
        const x = p.x - (f > land ? (f - land) * BELT_SPEED : 0)
        const squash = f >= land && f < land + 5 ? 0.06 * Math.sin(((f - land) / 5) * Math.PI) : 0
        const cardH = 170
        return (
          <Card
            key={p.channel}
            channel={p.channel}
            text={p.text}
            width={280}
            style={{ left: x - 140, top: 470 + fall * (BELT_TOP - cardH - 470), transform: `rotate(${(1 - fall) * (p.x > 540 ? -8 : 8)}deg) scale(${1 + squash}, ${1 - squash})`, transformOrigin: "50% 100%" }}
          />
        )
      })}
    </Paper>
  )
}

// ── 2 · the titles ─────────────────────────────────────────────────────────

const titleStyle: CSSProperties = { textAlign: "center", fontSize: 118, fontWeight: 800, color: PAPER, letterSpacing: "-0.035em", lineHeight: 1.05 }

function Titles({ f }: { f: number }) {
  const lands = TITLE.map((t) => t + SLAM_LAND)
  return (
    <AbsoluteFill style={{ background: INK, justifyContent: "center", paddingBottom: 320, transform: shake(f, lands, 18, 12) }}>
      <Slam f={f} at={TITLE[0]} style={titleStyle}>
        כל הפניות
        <br />
        מגיעות.
      </Slam>
      <Slam f={f} at={TITLE[1]} style={{ ...titleStyle, marginTop: 40, fontSize: 96, color: "#9a9a96" }}>
        לא כולן רציניות.
      </Slam>
    </AbsoluteFill>
  )
}

// ── 3 · the press ──────────────────────────────────────────────────────────

function StampMark({ hot, p, size }: { hot: boolean; p: number; size: number }) {
  if (p <= 0) return null
  return (
    <div
      style={{
        padding: `${size * 0.06}px ${size * 0.36}px`,
        borderRadius: size * 0.2,
        border: `${size * 0.09}px solid ${INK}`,
        background: hot ? INK : "transparent",
        color: hot ? PAPER : INK,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.1,
        transform: `rotate(-9deg) scale(${1 + (1 - p) * 0.4})`,
        opacity: p,
      }}
    >
      {hot ? "חם" : "קר"}
    </div>
  )
}

const PRESS_REST = 330
const CARD_TOP = 640

function Press({ f }: { f: number }) {
  const k = Math.min(LEADS.length - 1, Math.max(0, Math.floor((f - STAMP_AT) / STAMP_EVERY)))
  const lead = LEADS[k]
  const t = f - stampStart(k)
  const enter = ease(t, 0, 12)
  const exit = clamp01((t - 46) / 10) ** 2
  const x = (1 - enter) * 900 - exit * 1100
  const scan = clamp01((t - 12) / 14)
  const down = t < IMPACT - 4 ? 0 : t < IMPACT ? ((t - IMPACT + 4) / 4) ** 2 : t < IMPACT + 3 ? 1 : 1 - ease(t, IMPACT + 3, 10)
  const pressY = PRESS_REST + down * (CARD_TOP - 60 - PRESS_REST)
  const impacts = LEADS.map((_, i) => stampStart(i) + IMPACT)
  const stamped = t >= IMPACT ? ease(t, IMPACT, 3) : 0
  const reason = ease(t, IMPACT + 6, 8)
  const zoom = punch(f, impacts, 0.05, 12)
  return (
    <Paper style={{ transform: `${shake(f, impacts, 14, 10)} scale(${zoom})` }}>
      {/* the press: its rod, its head */}
      <div style={{ position: "absolute", left: 505, width: 70, top: -20, height: pressY + 20, background: WHITE, border: `${LINE}px solid ${INK}`, borderTop: "none" }} />
      <div style={{ position: "absolute", left: 330, width: 420, top: pressY, height: 120, borderRadius: 24, background: INK, boxShadow: DROP, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: PAPER, letterSpacing: "0.08em" }}>
        סיווג
      </div>
      <Belt f={f} top={CARD_TOP + 330} speed={4} />
      <Card channel={lead.channel} name={lead.name} text={lead.text} width={720} style={{ left: 180 + x, top: CARD_TOP, minHeight: 300 }}>
        {/* the scanning beam */}
        {scan > 0 && scan < 1 && (
          <div style={{ position: "absolute", top: -12, bottom: -12, right: `${scan * 100}%`, width: 10, borderRadius: 9, background: INK, boxShadow: `0 0 0 6px rgba(17,17,17,0.12), 30px 0 60px 10px rgba(17,17,17,0.12)` }} />
        )}
        <div style={{ position: "absolute", left: 40, bottom: 34 }}>
          <StampMark hot={lead.hot} p={stamped} size={84} />
        </div>
      </Card>
      <div style={{ position: "absolute", top: CARD_TOP + 450, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: reason * (1 - exit), transform: `translateY(${(1 - reason) * 20}px)` }}>
        <div style={{ padding: "14px 34px", borderRadius: 999, background: WHITE, border: `${LINE}px solid ${INK}`, fontSize: 40, fontWeight: 800, color: INK }}>
          {lead.hot ? "רוצה לקבוע" : "עוד לא עכשיו"}
        </div>
      </div>
      <Flash f={f} hits={impacts} dur={5} max={0.8} />
    </Paper>
  )
}

// ── 4 · the sorting ────────────────────────────────────────────────────────

const DAYS = ["א׳", "ב׳", "ג׳", "ד׳"]
const WEEK = { top: 560, left: 65, width: 950, height: 380 }
const TRAY = { top: 1000, height: 220 }

function dayBox(d: number) {
  const w = (WEEK.width - 3 * 18) / 4
  // Sunday on the right, as a Hebrew week reads.
  return { left: WEEK.left + WEEK.width - (d + 1) * w - d * 18, width: w }
}

function MiniCard({ lead, p, target }: { lead: Lead; p: number; target: { left: number; top: number; width: number } }) {
  // Flies in from the right edge along an arc, landing on its target.
  const e = ease(p, 0, 1)
  const fromX = 1120
  const fromY = 760
  const x = fromX + (target.left - fromX) * e
  const y = fromY + (target.top - fromY) * e - Math.sin(e * Math.PI) * 180
  return (
    <div style={{ position: "absolute", left: x, top: y, width: target.width, padding: "14px 16px", borderRadius: 16, background: lead.hot ? INK : WHITE, color: lead.hot ? PAPER : INK, border: `${LINE}px solid ${INK}`, boxShadow: `6px 8px 0 ${INK}`, transform: `rotate(${(1 - e) * -14}deg)`, opacity: clamp01(p * 4) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 30, fontWeight: 800 }}>
        <div style={{ width: 18, height: 18, borderRadius: 999, background: CHANNEL[lead.channel].color, border: `3px solid ${lead.hot ? PAPER : INK}` }} />
        {lead.name}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, marginTop: 4, opacity: 0.85 }}>{lead.slot ? lead.slot[1] : "תזכורת בעוד שבוע"}</div>
    </div>
  )
}

function Sorting({ f }: { f: number }) {
  const inP = ease(f, SORT, 12)
  return (
    <Paper>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}>
        <Slam f={f} at={SORT_TITLES[0]} style={{ fontSize: 84, fontWeight: 800, color: INK, letterSpacing: "-0.03em" }}>
          החמים ביומן.
        </Slam>
        <Slam f={f} at={SORT_TITLES[1]} style={{ fontSize: 84, fontWeight: 800, color: MUTED, letterSpacing: "-0.03em", marginTop: 6 }}>
          הקרים בהמשך טיפול.
        </Slam>
      </div>
      {/* the week */}
      {DAYS.map((d, i) => {
        const b = dayBox(i)
        return (
          <div key={d} style={{ position: "absolute", top: WEEK.top, left: b.left, width: b.width, height: WEEK.height, borderRadius: 22, background: WHITE, border: `${LINE}px solid ${INK}`, boxShadow: DROP, opacity: inP, transform: `translateY(${(1 - inP) * 40}px)` }}>
            <div style={{ padding: "14px 0", textAlign: "center", fontSize: 36, fontWeight: 800, color: INK, borderBottom: `${LINE}px solid ${INK}` }}>{d}</div>
          </div>
        )
      })}
      {/* the follow-up tray */}
      <div style={{ position: "absolute", top: TRAY.top, left: 65, right: 65, height: TRAY.height, borderRadius: 26, background: "#e2e1db", border: `${LINE}px solid ${INK}`, boxShadow: DROP, opacity: inP, transform: `translateY(${(1 - inP) * 40}px)` }}>
        <div style={{ position: "absolute", top: 20, right: 30, fontSize: 36, fontWeight: 800, color: INK }}>המשך טיפול</div>
        <div style={{ position: "absolute", top: 70, right: 30, fontSize: 28, fontWeight: 500, color: MUTED }}>הסוכן חוזר אליהם בזמן שנקבע</div>
      </div>
      {LAUNCH_ORDER.map((k, i) => {
        const lead = LEADS[k]
        const p = clamp01((f - LAUNCH[i]) / 14)
        if (p <= 0) return null
        const target = lead.slot
          ? { ...dayBox(lead.slot[0]), top: WEEK.top + 110 + (lead.slot[0] % 2) * 100 }
          : { left: 90, top: TRAY.top + 60, width: 400 }
        const t = { left: target.left + 10, top: target.top, width: target.width - 20 }
        return <MiniCard key={k} lead={lead} p={p} target={lead.slot ? t : target} />
      })}
      <Flash f={f} hits={LAUNCH.map((l) => l + 14)} dur={4} max={0.25} />
    </Paper>
  )
}

// ── 5 · the dashboard ──────────────────────────────────────────────────────

function Dashboard({ f }: { f: number }) {
  const zoom = ease(f, DASH, 18)
  const rows = [LEADS[0], LEADS[2], LEADS[3], LEADS[1]]
  const cell: CSSProperties = { fontSize: 34, fontWeight: 700, color: INK }
  return (
    <Paper>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontSize: 84, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1.08, opacity: ease(f, DASH + 10, 12), transform: `translateY(${(1 - ease(f, DASH + 10, 14)) * 30}px)` }}>
        כל ליד, מכל ערוץ,
        <br />
        ממוין.
      </div>
      <div style={{ position: "absolute", top: 560, left: 65, right: 65, borderRadius: 28, background: WHITE, border: `${LINE}px solid ${INK}`, boxShadow: DROP, overflow: "hidden", transform: `scale(${1.25 - 0.25 * zoom})`, opacity: zoom, transformOrigin: "50% 30%" }}>
        <div style={{ display: "flex", padding: "22px 30px", background: INK, color: PAPER, fontSize: 30, fontWeight: 800 }}>
          <span style={{ flex: 1.1 }}>ליד</span>
          <span style={{ flex: 1.3 }}>ערוץ</span>
          <span style={{ flex: 1.6 }}>סטטוס</span>
        </div>
        {rows.map((r, i) => {
          const p = ease(f, DASH + 30 + i * 12, 10)
          return (
            <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "26px 30px", borderTop: i ? `3px solid rgba(17,17,17,0.12)` : "none", opacity: p, transform: `translateX(${(1 - p) * 80}px)` }}>
              <span style={{ ...cell, flex: 1.1 }}>{r.name}</span>
              <span style={{ ...cell, flex: 1.3, display: "flex", alignItems: "center", gap: 12, fontWeight: 500 }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: CHANNEL[r.channel].color, border: `3px solid ${INK}` }} />
                {CHANNEL[r.channel].label}
              </span>
              <span style={{ flex: 1.6, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ padding: "6px 18px", borderRadius: 999, border: `4px solid ${INK}`, background: r.hot ? INK : WHITE, color: r.hot ? PAPER : INK, fontSize: 28, fontWeight: 800 }}>{r.hot ? "חם" : "קר"}</span>
                <span style={{ fontSize: 28, fontWeight: 600, color: MUTED, display: "flex", alignItems: "center", gap: 6 }}>
                  {r.hot && <Check size={28} strokeWidth={3.4} color={INK} />}
                  {r.hot ? `נקבע ${r.slot?.[1]}` : "המשך טיפול"}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </Paper>
  )
}

export function HotOrCold({ safeZones }: { safeZones: boolean }) {
  const f = useCurrentFrame()
  const endLand = END + STAMP_LAND
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: PAPER }}>
      {f < TITLE[0] - 4 && <Pipes f={f} />}
      {f >= TITLE[0] - 4 && f < STAMP_AT - 4 && <Titles f={f} />}
      {f >= STAMP_AT - 4 && f < SORT && <Press f={f} />}
      {f >= SORT && f < DASH && <Sorting f={f} />}
      {f >= DASH && f < END && <Dashboard f={f} />}
      {f >= END && (
        <AbsoluteFill style={{ transform: shake(f, [endLand], 16, 12) }}>
          <EndCard f={f - END} entry="stamp" />
        </AbsoluteFill>
      )}
      <Flash f={f} hits={[TITLE[0] - 4, STAMP_AT - 4, SORT, endLand]} dur={6} max={0.9} />
      <Grain id="paper-grain" opacity={0.14} baseFrequency={0.8} />
      <Track cues={cues} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
