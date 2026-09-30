import { Check } from "lucide-react"
import type { ReactNode } from "react"
import { AbsoluteFill, spring, useCurrentFrame } from "remotion"
import { EndCard } from "../components/EndCard"
import { Grain } from "../components/Grain"
import { SafeZones } from "../components/SafeZones"
import { CHANNEL_ICON } from "../components/icons"
import { FONT_STACK } from "../fonts"
import { Flash, SLAM_LAND, Slam, Whip, punch, rand, shake } from "../fx"
import { BRAND_STING, Track, cueSheet } from "../sound"
import { CHANNEL, HAIRLINE, INK, MUTED, SURFACE, WHITE, clamp01, ease, type Channel } from "../theme"

/** "כמה עולה?" — the flood. One question becomes hundreds across the three
 *  channels; a cut to black; then a wave answers every one of them, and the
 *  same question gets a full answer in each channel. */

const GREEN = CHANNEL.whatsapp.color

// ── timeline ───────────────────────────────────────────────────────────────
const FIRST = 0
const GENS = [60, 84, 108, 132, 156] // each doubling (and more) of the questions
const HEADLINE = 166
const BLACK = 210
const WAVE = 246
const WAVE_DUR = 60
const BELL = WAVE + 80
const OPEN = WAVE + 64 // the camera finds one question and opens its answer
const CHANNELS_AT = 424
const CH_EVERY = 150 // two exchanges per channel
const LINE2 = CHANNELS_AT + 2 * CH_EVERY + 4
const END = CHANNELS_AT + 3 * CH_EVERY
export const FLOOD_FRAMES = END + 110

const QUESTIONS = ["כמה עולה?", "מחיר?", "כמה זה עולה?", "יש מחירון?", "כמה עולה טיפול?", "כמה?", "מה המחיר?", "כמה עולה אצלכם?", "אפשר מחיר?", "כמה עולה תור?"]
const CHANNELS: Channel[] = ["whatsapp", "instagram", "phone"]

// The world the bubbles live in: a grid of cells around the first bubble,
// filled from the centre outward (with a little noise), so every generation
// rings the last. The grid reaches past every edge of the frame at the
// camera's widest, and the last generation takes every cell left, so at its
// peak the flood covers the whole screen, corner to corner.
const CELL = { w: 380, h: 150 }
const ORIGIN = { x: 540, y: 760 } // on screen: the first bubble, in the safe band
const Z_WIDE = 0.33
const REACH = {
  x: ORIGIN.x / Z_WIDE + CELL.w,
  top: ORIGIN.y / Z_WIDE + CELL.h,
  bottom: (1920 - ORIGIN.y) / Z_WIDE + CELL.h,
}
const COLS = Math.ceil((2 * REACH.x) / CELL.w) + 1
const ROWS = Math.ceil((REACH.top + REACH.bottom) / CELL.h) + 1
const COUNTS = [1, 2, 8, 30, 110, COLS * ROWS]

type Q = { x: number; y: number; text: string; channel: Channel; at: number; tilt: number }

const BUBBLES: Q[] = (() => {
  const cells: { x: number; y: number; d: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = -REACH.x + c * CELL.w + (r % 2 ? CELL.w / 2 : 0) + (rand(r * 31 + c) - 0.5) * 60
      const y = -REACH.top + r * CELL.h + (rand(r * 17 + c * 5) - 0.5) * 30
      // A rounded-rectangle distance in the frame's proportions, so each
      // generation fills a frame-shaped block (corners included) that the
      // camera can pull back to the edges of.
      const sx = Math.abs(x) / 0.56
      const sy = Math.abs(y)
      cells.push({ x, y, d: 0.75 * Math.max(sx, sy) + 0.25 * Math.hypot(sx, sy) + rand(r * 7 + c * 13) * 200 })
    }
  }
  cells.sort((a, b) => a.d - b.d)
  // The first bubble sits dead centre.
  cells[0] = { x: 0, y: 0, d: 0 }
  return cells.map((cell, i) => {
    const gen = COUNTS.findIndex((n) => i < n)
    // The first bubble is already mid-pop on frame 0: no blank opening frame.
    const start = gen === 0 ? FIRST - 3 : GENS[gen - 1]
    const size = gen === 0 ? 1 : COUNTS[gen] - COUNTS[gen - 1]
    const k = gen === 0 ? 0 : i - COUNTS[gen - 1]
    return {
      x: cell.x,
      y: cell.y,
      text: QUESTIONS[i % QUESTIONS.length],
      channel: CHANNELS[Math.floor(rand(i * 3.3) * 3)],
      at: start + Math.floor((k / size) * 12),
      tilt: (rand(i * 9.1) - 0.5) * 6,
    }
  })
})()

// The camera pulls back as the swarm grows: one step per generation, taken
// while that generation pops in, to the zoom at which it reaches the edges
// of the frame (from the third one on; the first few are meant to be few).
const ZOOMS = [1.7, 1.45, 1.2, 1.1, 0.64, Z_WIDE]
function zoomAt(f: number) {
  let z = ZOOMS[0]
  GENS.forEach((g, i) => {
    z += (ZOOMS[i + 1] - z) * ease(f, g, 10)
  })
  return z
}

// The answer the camera finds after the wave.
const HERO = BUBBLES.findIndex((b, i) => i > 3 && b.text === "כמה עולה טיפול?")

// ── pieces ─────────────────────────────────────────────────────────────────

const popIn = (f: number, at: number) => spring({ frame: f - at, fps: 30, config: { damping: 14, stiffness: 300, mass: 0.6 } })

function Question({ q, f, answered }: { q: Q; f: number; answered: number }) {
  const p = popIn(f, q.at)
  const color = CHANNEL[q.channel].color
  return (
    <div
      style={{
        position: "absolute",
        left: q.x,
        top: q.y,
        transform: `translate(-50%, -50%) rotate(${q.tilt * (1 - answered)}deg) scale(${Math.max(0, p) * (1 + 0.08 * Math.sin(answered * Math.PI))})`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "20px 30px",
        borderRadius: 36,
        borderStartStartRadius: 12,
        whiteSpace: "nowrap",
        fontSize: 44,
        fontWeight: 600,
        background: answered > 0.5 ? GREEN : WHITE,
        color: answered > 0.5 ? WHITE : INK,
        border: answered > 0.5 ? `2px solid ${GREEN}` : `2px solid ${HAIRLINE}`,
        boxShadow: "0 18px 40px -28px rgba(0,0,0,0.5)",
      }}
    >
      {answered > 0.5 ? (
        <Check size={40} strokeWidth={3.4} />
      ) : (
        <div style={{ width: 20, height: 20, borderRadius: 999, background: color, flexShrink: 0 }} />
      )}
      {q.text}
    </div>
  )
}

/** When the wave (right edge → left edge, as the page reads) reaches x. */
const HALF = REACH.x
const answeredAt = (x: number) => WAVE + ((HALF - x) / (2 * HALF)) * WAVE_DUR

function Swarm({ f }: { f: number }) {
  // After the black the swarm is back, frozen at its widest, for the wave.
  const t = f >= WAVE ? GENS[4] + 40 : f
  const open = ease(f, OPEN, 22)
  const hero = BUBBLES[HERO]
  const base = zoomAt(t)
  const zoom = base + (1.35 - base) * open
  const cx = -hero.x * open
  const cy = -hero.y * open
  const hits = f < BLACK ? GENS : []
  const cam = punch(f, hits, 0.04, 10)
  return (
    <AbsoluteFill style={{ background: SURFACE, transform: shake(f, hits.slice(2), 8, 8) }}>
      <div style={{ position: "absolute", left: ORIGIN.x, top: ORIGIN.y, transform: `scale(${zoom * cam}) translate(${cx}px, ${cy}px)` }}>
        {BUBBLES.map((q, i) => {
          if (t < q.at) return null
          const answered = f >= WAVE ? ease(f, answeredAt(q.x), 6) : 0
          if (open > 0.02 && i === HERO) return null
          return <Question key={i} q={q} f={t} answered={answered} />
        })}
      </div>
      {open > 0 && <AbsoluteFill style={{ background: SURFACE, opacity: 0.88 * open }} />}
      {open > 0 && <HeroAnswer f={f} p={open} />}
    </AbsoluteFill>
  )
}

function HeroAnswer({ f, p }: { f: number; p: number }) {
  const answer = ease(f, OPEN + 16, 10)
  return (
    <div style={{ position: "absolute", top: 520, left: 65, right: 65, display: "flex", flexDirection: "column", gap: 26, opacity: clamp01(p * 2) }}>
      <div style={{ alignSelf: "flex-start", padding: "24px 36px", borderRadius: 40, borderStartStartRadius: 14, background: WHITE, border: `2px solid ${HAIRLINE}`, fontSize: 56, fontWeight: 600, color: INK, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: CHANNEL.instagram.color }} />
        כמה עולה טיפול?
      </div>
      <div style={{ alignSelf: "flex-end", maxWidth: "88%", padding: "28px 38px", borderRadius: 40, borderStartEndRadius: 14, background: GREEN, color: WHITE, fontSize: 54, lineHeight: 1.32, boxShadow: "0 24px 50px -28px rgba(22,163,74,0.9)", opacity: answer, transform: `translateY(${(1 - answer) * 40}px) scale(${0.92 + 0.08 * answer})`, transformOrigin: "left top" }}>
        טיפול פנים קלאסי 280₪, כולל ניקוי עמוק. יש מקום ביום ג׳ ב-14:00
      </div>
    </div>
  )
}

function Headline({ f }: { f: number }) {
  return (
    <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Slam f={f} at={HEADLINE} style={{ padding: "34px 54px", borderRadius: 34, background: INK, color: WHITE, textAlign: "center", fontSize: 96, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)" }}>
        אותה שאלה.
        <br />
        כל יום. כל היום.
      </Slam>
    </div>
  )
}

// ── 5 · the three channels ─────────────────────────────────────────────────

/** Each channel: the question, an answer, a follow-up, and the answer that
 *  moves it to a booking. Frames are relative to the channel's start. */
const CHATS: Record<Channel, { from: "customer" | "agent"; text: string; at: number }[]> = {
  whatsapp: [
    { from: "customer", text: "כמה עולה?", at: 6 },
    { from: "agent", text: "טיפול פנים קלאסי 280₪, כולל ניקוי עמוק 🙂", at: 32 },
    { from: "customer", text: "יש מקום השבוע?", at: 72 },
    { from: "agent", text: "יש ביום ג׳ ב-14:00 או ביום ה׳ ב-11:00. מה מתאים?", at: 98 },
  ],
  instagram: [
    { from: "customer", text: "מחיר?", at: 6 },
    { from: "agent", text: "שלחתי לך מחירון בפרטי 🙂 הכי מבוקש: טיפול פנים ב-280₪", at: 32 },
    { from: "customer", text: "אפשר לקבוע דרכך?", at: 72 },
    { from: "agent", text: "בטח! איזה יום נוח לך השבוע?", at: 98 },
  ],
  phone: [
    { from: "customer", text: "כמה זה עולה?", at: 6 },
    { from: "agent", text: "מתחיל ב-280₪, כולל ניקוי עמוק.", at: 32 },
    { from: "customer", text: "ויש משהו מחר?", at: 72 },
    { from: "agent", text: "יש מחר ב-16:00. לקבוע לך?", at: 98 },
  ],
}
const TYPING_LEAD = 16 // the agent's dots show for this long before each answer

// ── sound ──────────────────────────────────────────────────────────────────
const { sfx, file, cues } = cueSheet("flood")
sfx(FIRST, "pop", 0.8)
sfx(0, "air", 0.8, BLACK) // cut with the swarm at the black
sfx(GENS[0], "pop", 0.8)
sfx(GENS[0] + 2, "swarm", 0.85, BLACK - GENS[0] - 2) // cut dead at the black
GENS.slice(1).forEach((at) => sfx(at, "double", 0.7))
sfx(HEADLINE + SLAM_LAND, "slam", 0.8)
sfx(WAVE, "domino", 0.8)
sfx(WAVE, "air", 0.8, END - WAVE)
CHANNELS.forEach((channel, k) => {
  const at = CHANNELS_AT + k * CH_EVERY
  if (k > 0) sfx(at - 6, "whip", 0.6)
  for (const m of CHATS[channel]) {
    if (m.from === "customer") sfx(at + m.at, "pop", 0.6)
    else {
      for (let tap = at + m.at - TYPING_LEAD + 2; tap < at + m.at - 2; tap += 5) sfx(tap, "tap", 0.5)
      sfx(at + m.at, "answer", 0.7)
    }
  }
})
sfx(CHANNELS_AT + SLAM_LAND, "slam", 0.7)
sfx(LINE2 + SLAM_LAND, "slam", 0.6)
file(END, BRAND_STING, 0.9)

function ChatBubble({ from, text, p, color, call }: { from: "customer" | "agent"; text: string; p: number; color: string; call: boolean }) {
  const agent = from === "agent"
  return (
    <div
      style={{
        alignSelf: agent ? "flex-end" : "flex-start",
        maxWidth: "88%",
        padding: agent ? "24px 34px" : "20px 32px",
        borderRadius: 38,
        borderStartStartRadius: agent ? 38 : 12,
        borderStartEndRadius: agent ? 12 : 38,
        background: agent ? (call ? WHITE : color) : WHITE,
        color: agent && !call ? WHITE : INK,
        border: agent && !call ? "none" : `2px solid ${HAIRLINE}`,
        borderInlineEnd: agent && call ? `8px solid ${color}` : undefined,
        fontSize: agent ? 46 : 48,
        fontWeight: agent ? 400 : 600,
        lineHeight: 1.3,
        boxShadow: agent ? `0 24px 50px -30px ${color}` : "0 18px 40px -30px rgba(0,0,0,0.4)",
        opacity: clamp01(p * 1.5),
        transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: agent ? "left bottom" : "right bottom",
      }}
    >
      {call ? `״${text}״` : text}
    </div>
  )
}

function ChannelScreen({ channel, f }: { channel: Channel; f: number }) {
  const color = CHANNEL[channel].color
  const Icon = CHANNEL_ICON[channel]
  const call = channel === "phone"
  const chat = CHATS[channel]
  // The thread is anchored to the bottom of the safe band and grows upward,
  // each entry opening its own height so the older ones glide up.
  const entries: { key: string; at: number; until?: number; node: (p: number) => ReactNode }[] = []
  for (const m of chat) {
    if (m.from === "agent") {
      entries.push({
        key: `t${m.at}`,
        at: m.at - TYPING_LEAD,
        until: m.at,
        node: () => (
          <div style={{ alignSelf: "flex-end", display: "flex", gap: 12, padding: "30px 36px", borderRadius: 38, background: `color-mix(in srgb, ${color} 85%, white)` }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: WHITE, opacity: 0.5 + 0.5 * Math.sin(((f - i * 4) / 18) * Math.PI * 2) }} />
            ))}
          </div>
        ),
      })
    }
    entries.push({ key: `m${m.at}`, at: m.at, node: (p) => <ChatBubble from={m.from} text={m.text} p={p} color={color} call={call} /> })
  }
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 60% at 80% 30%, color-mix(in srgb, ${color} 10%, ${SURFACE}) 0%, ${SURFACE} 70%)` }}>
      <div style={{ position: "absolute", top: 520, left: 65, right: 65, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: color, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={40} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: INK }}>{CHANNEL[channel].label}</div>
          <div style={{ fontSize: 27, color: MUTED }}>קליניקה לטיפולי פנים</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 616, bottom: 1920 - 1236, left: 65, right: 65, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden", maskImage: "linear-gradient(to bottom, transparent 0px, black 60px)" }}>
        {entries.map((e) => {
          if (f < e.at) return null
          const open = e.until !== undefined && f >= e.until ? 1 - ease(f, e.until, 5) : ease(f, e.at, 7)
          if (open <= 0.001) return null
          return (
            <div key={e.key} style={{ display: "grid", gridTemplateRows: `${open}fr` }}>
              <div style={{ minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 22 }}>{e.node(popIn(f, e.at))}</div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function Channels({ f }: { f: number }) {
  const scene = (k: number) => <ChannelScreen channel={CHANNELS[k]} f={f - (CHANNELS_AT + k * CH_EVERY)} />
  const body: ReactNode =
    f < CHANNELS_AT + CH_EVERY - 6 ? (
      scene(0)
    ) : f < CHANNELS_AT + 2 * CH_EVERY - 6 ? (
      <Whip f={f} at={CHANNELS_AT + CH_EVERY - 6} dur={8} id="ch1" from={scene(0)} to={scene(1)} />
    ) : (
      <Whip f={f} at={CHANNELS_AT + 2 * CH_EVERY - 6} dur={8} id="ch2" from={scene(1)} to={scene(2)} />
    )
  return (
    <AbsoluteFill>
      {body}
      <div style={{ position: "absolute", top: 290, left: 0, right: 0, textAlign: "center" }}>
        <Slam f={f} at={CHANNELS_AT} style={{ fontSize: 104, fontWeight: 800, color: INK, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          עונה במקומכם.
        </Slam>
        <Slam f={f} at={LINE2} style={{ marginTop: 14, fontSize: 52, fontWeight: 700, color: MUTED, letterSpacing: "-0.02em" }}>
          כל פעם, כמו בפעם הראשונה.
        </Slam>
      </div>
    </AbsoluteFill>
  )
}

export function Flood({ safeZones }: { safeZones: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: SURFACE }}>
      {(f < BLACK || (f >= WAVE && f < CHANNELS_AT)) && <Swarm f={f} />}
      {f >= HEADLINE && f < BLACK && <Headline f={f} />}
      {f >= BLACK && f < WAVE && (
        <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", paddingBottom: 300 }}>
          <div style={{ fontSize: 110, fontWeight: 800, color: WHITE, letterSpacing: "-0.035em", opacity: f >= BLACK + 3 ? 1 : 0 }}>ומי עונה?</div>
        </AbsoluteFill>
      )}
      {f >= CHANNELS_AT && f < END && <Channels f={f} />}
      {f >= END && <EndCard f={f - END} entry="brand" />}
      <Flash f={f} hits={[...GENS, WAVE, BELL, CHANNELS_AT, END]} dur={6} max={0.7} />
      <Grain id="flood-grain" opacity={0.05} />
      <Track cues={cues} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
