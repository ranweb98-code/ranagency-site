import { Check } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { AbsoluteFill, spring, useCurrentFrame } from "remotion"
import { EndCard } from "../components/EndCard"
import { Grain } from "../components/Grain"
import { SafeZones } from "../components/SafeZones"
import { CHANNEL_ICON } from "../components/icons"
import { FONT_STACK, MONO_STACK } from "../fonts"
import { Flash, Glitch, SLAM_LAND, Scanlines, Slam, punch, rand, shake } from "../fx"
import { Track, cueSheet } from "../sound"
import { CHANNEL, HAIRLINE, INK, MUTED, SURFACE, WHITE, clamp01, ease } from "../theme"

/** "הקישו 1" — robot vs real Hebrew. A phone menu types itself on an old
 *  terminal and loops, faster and faster, until the screen tears; then the
 *  white world of the brand, where an agent simply answers in Hebrew and
 *  books the slot. */

const GREEN = CHANNEL.whatsapp.color
const PHOSPHOR = "#e9ece8"

// ── timeline ───────────────────────────────────────────────────────────────
const HEADLINE = 86
const LOOPS = [
  { press: 118, error: 120, restart: 128, cps: 3 },
  { press: 146, error: 148, restart: 153, cps: 5 },
  { press: 166, error: 168, restart: 171, cps: 9 },
  { press: 182, error: 184, restart: 186, cps: 24 },
  { press: 193, error: 195, restart: 197, cps: 60 },
]
const GLITCH = 204
const BLACKOUT = 218 // a white flash, then half a second of nothing
const CHAT = 234
const MSG = { c1: 252, typing1: 284, a1: 318, c2: 380, typing2: 402, a2: 430, chip: 482 }
const COMPARE = 546
const WIPE_OLD = 574
const SAY = [600, 630]
const END = 750
export const PRESS_ONE_FRAMES = 900

const MENU = ["שלום, הגעתם לשירות.", "לבירורים הקישו 1", "למחירים הקישו 2", "לנציג הישארו על הקו"]
const FIRST = [8, 30, 50, 68] // the first pass, typed at 1.6 characters a frame
const FIRST_CPS = 1.6

type LogLine = { text: string; start: number; cps: number; error?: boolean }

const LOG: LogLine[] = [
  ...MENU.map((text, i) => ({ text, start: FIRST[i], cps: FIRST_CPS })),
  ...LOOPS.flatMap((l) => [
    { text: "בחירה שגויה", start: l.error, cps: 99, error: true },
    ...MENU.map((text, i) => ({ text, start: l.restart + Math.ceil((i * 20) / l.cps), cps: l.cps })),
  ]),
]

// ── sound ──────────────────────────────────────────────────────────────────
const { sfx, cues } = cueSheet("ivr")
sfx(0, "hum", 0.7, GLITCH)
FIRST.forEach((at, i) => {
  const chars = MENU[i].length
  for (let c = 0; c < chars; c += 3) sfx(at + Math.round(c / FIRST_CPS), "key", 0.55)
  if (i > 0) sfx(at + Math.ceil(chars / FIRST_CPS) + 2, "dtmf", 0.5)
})
sfx(HEADLINE + SLAM_LAND, "thump", 0.8)
for (const l of LOOPS) {
  sfx(l.press, "dtmf", 0.55)
  sfx(l.error, "error", 0.6)
}
sfx(GLITCH, "crunch", 0.8)
sfx(BLACKOUT, "glint", 0.5)
sfx(CHAT, "swish", 0.45)
sfx(MSG.c1, "wood", 0.75)
sfx(MSG.a1, "wood", 0.75)
sfx(MSG.c2, "wood", 0.75)
sfx(MSG.a2, "wood", 0.8)
sfx(MSG.chip, "chip", 0.8)
sfx(COMPARE, "swish", 0.5)
sfx(WIPE_OLD, "error", 0.25)
sfx(WIPE_OLD + 2, "swish", 0.5)
sfx(SAY[0] + SLAM_LAND, "knock", 0.85)
sfx(SAY[0] + 12, "glint", 0.4)
sfx(SAY[1] + SLAM_LAND, "knock", 0.75)
sfx(END, "end", 0.85)

// ── 1–3 · the menu, the loop, the break ────────────────────────────────────

const LINE_H = 70
const VISIBLE = 8

function Terminal({ f }: { f: number }) {
  const shown = LOG.filter((l) => f >= l.start)
  const scroll = Math.max(0, shown.length - VISIBLE)
  const flicker = 0.93 + 0.07 * rand(Math.floor(f / 2) * 1.7)
  const cursorOn = Math.floor(f / 8) % 2 === 0
  const errHits = LOOPS.map((l) => l.error)
  return (
    <AbsoluteFill style={{ background: "#050605", transform: shake(f, errHits, 12, 9) }}>
      <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 40%, rgba(233,236,232,0.07), transparent 70%)" }} />
      <div style={{ position: "absolute", top: 300, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: MONO_STACK, fontSize: 32, color: PHOSPHOR, opacity: 0.55 * flicker }}>
        <span>מענה אוטומטי</span>
        <span dir="ltr">LINE 01 ● {f % 30 < 15 ? "REC" : "   "}</span>
      </div>
      <div style={{ position: "absolute", top: 356, left: 80, right: 80, height: 2, background: PHOSPHOR, opacity: 0.25 }} />
      <div style={{ position: "absolute", top: 384, left: 80, right: 80, height: LINE_H * VISIBLE, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${-scroll * LINE_H}px)` }}>
          {shown.map((l, i) => {
            const n = Math.min(l.text.length, Math.floor((f - l.start) * l.cps) + 1)
            const typing = n < l.text.length
            const last = i === shown.length - 1
            return (
              <div
                key={i}
                style={{
                  height: LINE_H,
                  display: "flex",
                  alignItems: "center",
                  fontFamily: MONO_STACK,
                  fontSize: 50,
                  fontWeight: l.error ? 700 : 400,
                  color: l.error ? "#050605" : PHOSPHOR,
                  opacity: flicker,
                  textShadow: l.error ? undefined : "0 0 12px rgba(233,236,232,0.55)",
                }}
              >
                <span style={l.error ? { background: PHOSPHOR, padding: "0 18px", boxShadow: "0 0 30px rgba(233,236,232,0.6)" } : undefined}>
                  {l.text.slice(0, n)}
                </span>
                {(typing || last) && !l.error && (
                  <span style={{ display: "inline-block", width: 28, height: 48, marginInlineStart: 6, background: PHOSPHOR, opacity: typing || cursorOn ? 0.9 : 0 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* the headline, in the ad's own type */}
      <div style={{ position: "absolute", top: 1000, left: 0, right: 0, fontFamily: FONT_STACK }}>
        <Slam f={f} at={HEADLINE} style={{ textAlign: "center", fontSize: 92, fontWeight: 800, color: WHITE, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
          ככה נשמע
          <br />
          ״מענה אוטומטי״.
        </Slam>
      </div>
      <Scanlines opacity={0.22} />
      <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
      <Flash f={f} hits={errHits} dur={4} max={0.18} />
    </AbsoluteFill>
  )
}

// ── 4 · the white world: a real conversation ───────────────────────────────

const bubbleIn = (f: number, at: number) =>
  spring({ frame: f - at, fps: 30, config: { damping: 16, stiffness: 320, mass: 0.6 } })

function Bubble({ from, text, p, style }: { from: "customer" | "agent"; text: string; p: number; style?: CSSProperties }) {
  const agent = from === "agent"
  return (
    <div
      style={{
        alignSelf: agent ? "flex-end" : "flex-start",
        maxWidth: "86%",
        padding: "26px 38px",
        fontSize: 56,
        lineHeight: 1.3,
        borderRadius: 40,
        borderStartStartRadius: agent ? 40 : 14,
        borderStartEndRadius: agent ? 14 : 40,
        background: agent ? GREEN : WHITE,
        color: agent ? WHITE : INK,
        border: agent ? "none" : `2px solid ${HAIRLINE}`,
        boxShadow: agent ? "0 24px 50px -30px rgba(22,163,74,0.9)" : "0 20px 40px -32px rgba(0,0,0,0.5)",
        opacity: clamp01(p * 1.6),
        transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: agent ? "left bottom" : "right bottom",
        ...style,
      }}
    >
      {text}
    </div>
  )
}

function Typing({ f, p }: { f: number; p: number }) {
  return (
    <div style={{ alignSelf: "flex-end", display: "flex", gap: 14, padding: "36px 40px", borderRadius: 40, borderStartEndRadius: 14, background: `color-mix(in srgb, ${GREEN} 85%, white)`, opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}>
      {[0, 1, 2].map((i) => {
        const ph = Math.sin(((f - i * 4) / 18) * Math.PI * 2)
        return <div key={i} style={{ width: 20, height: 20, borderRadius: 999, background: WHITE, opacity: 0.45 + 0.55 * (0.5 + 0.5 * ph), transform: `translateY(${-4 * Math.max(0, ph)}px)` }} />
      })}
    </div>
  )
}

function ChatHeader({ f }: { f: number }) {
  const p = ease(f, CHAT, 12)
  const Icon = CHANNEL_ICON.whatsapp
  const ring = (f % 36) / 36
  return (
    <div style={{ position: "absolute", top: 290, left: 65, right: 65, display: "flex", alignItems: "center", gap: 22, opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ width: 100, height: 100, borderRadius: 999, background: GREEN, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={50} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 46, fontWeight: 700, color: INK }}>סטודיו לגבות</div>
        <div style={{ fontSize: 32, color: MUTED, marginTop: 2 }}>מקוון · מגיב תוך שניות</div>
      </div>
      <div style={{ position: "relative", width: 22, height: 22 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: GREEN, opacity: 0.5 * (1 - ring), transform: `scale(${1 + ring * 1.8})` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: GREEN }} />
      </div>
    </div>
  )
}

function BookedChip({ p }: { p: number }) {
  return (
    <div style={{ alignSelf: "center", marginTop: 18, display: "flex", alignItems: "center", gap: 16, padding: "18px 36px", borderRadius: 999, background: WHITE, border: `3px solid color-mix(in srgb, ${GREEN} 40%, transparent)`, boxShadow: "0 24px 50px -26px rgba(22,163,74,0.8)", opacity: clamp01(p * 1.5), transform: `scale(${0.7 + 0.3 * p})` }}>
      <div style={{ width: 54, height: 54, borderRadius: 999, background: GREEN, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={34} strokeWidth={3.4} />
      </div>
      <span style={{ fontSize: 46, fontWeight: 800, color: INK }}>תור נקבע · מחר 18:30</span>
    </div>
  )
}

function Chat({ f }: { f: number }) {
  const hits = [MSG.c1, MSG.a1, MSG.c2, MSG.a2, MSG.chip]
  const cam = punch(f, hits, 0.025, 10)
  const beats: { at: number; until?: number; node: (p: number) => ReactNode }[] = [
    { at: MSG.c1, node: (p) => <Bubble from="customer" text="היי, יש מקום מחר אחרי העבודה?" p={p} /> },
    { at: MSG.typing1, until: MSG.a1, node: (p) => <Typing f={f} p={p} /> },
    { at: MSG.a1, node: (p) => <Bubble from="agent" text="בטח! יש ב-18:30 או ב-19:15. מה מתאים?" p={p} /> },
    { at: MSG.c2, node: (p) => <Bubble from="customer" text="18:30 מעולה" p={p} /> },
    { at: MSG.typing2, until: MSG.a2, node: (p) => <Typing f={f} p={p} /> },
    { at: MSG.a2, node: (p) => <Bubble from="agent" text="קבעתי 🙂 אשלח תזכורת יום לפני" p={p} /> },
    { at: MSG.chip, node: (p) => <BookedChip p={p} /> },
  ]
  // The thread is anchored to the bottom of the safe band and grows upward
  // like a real chat; each entry opens its own height (a 0fr → 1fr grid row)
  // so the older messages glide up instead of jumping.
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 80% 10%, color-mix(in srgb, ${GREEN} 9%, ${SURFACE}) 0%, ${SURFACE} 65%)` }}>
      <ChatHeader f={f} />
      <div style={{ position: "absolute", top: 420, left: 65, right: 65, height: 2, background: HAIRLINE, opacity: ease(f, CHAT + 4, 12) }} />
      <div
        style={{
          position: "absolute",
          top: 430,
          bottom: 1920 - 1236,
          left: 65,
          right: 65,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          maskImage: "linear-gradient(to bottom, transparent 0px, black 90px)",
          transform: `scale(${cam})`,
          transformOrigin: "50% 85%",
        }}
      >
        {beats.map((b, i) => {
          if (f < b.at) return null
          const open = b.until !== undefined && f >= b.until ? 1 - ease(f, b.until, 6) : ease(f, b.at, 8)
          if (open <= 0.001) return null
          return (
            <div key={i} style={{ display: "grid", gridTemplateRows: `${open}fr` }}>
              <div style={{ minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 28 }}>{b.node(bubbleIn(f, b.at))}</div>
            </div>
          )
        })}
      </div>
      <Flash f={f} hits={[MSG.chip]} dur={6} max={0.5} />
    </AbsoluteFill>
  )
}

// ── 5 · the comparison ─────────────────────────────────────────────────────

function Compare({ f }: { f: number }) {
  const inP = ease(f, COMPARE, 12)
  const collapse = ease(f, WIPE_OLD + 6, 8)
  const lift = ease(f, WIPE_OLD + 8, 16)
  const hebrew = punch(f, [SAY[0] + 12], 0.14, 12)
  const old = (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 880,
          left: 90,
          right: 90,
          height: 150,
          borderRadius: 30,
          background: "#050605",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO_STACK,
          fontSize: 50,
          color: PHOSPHOR,
          textShadow: "0 0 12px rgba(233,236,232,0.55)",
          opacity: inP * (1 - collapse),
          transform: `translateY(${(1 - inP) * 60}px) scaleY(${1 - collapse})`,
        }}
      >
        לבירורים הקישו 1
      </div>
    </AbsoluteFill>
  )
  return (
    <AbsoluteFill style={{ background: SURFACE }}>
      {/* the old menu tears on a transparent paper, under the answer */}
      <Glitch f={f} at={WIPE_OLD} dur={8} id="old-menu" mode="light" strength={0.7} paper="transparent">
        {old}
      </Glitch>
      <div style={{ position: "absolute", top: 580 - lift * 40, left: 65, right: 65, display: "flex", flexDirection: "column", opacity: inP, transform: `scale(${1 + lift * 0.04})` }}>
        <Bubble from="agent" text="בטח! יש ב-18:30 או ב-19:15. מה מתאים?" p={1} />
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}>
        <Slam f={f} at={SAY[0]} style={{ fontSize: 128, fontWeight: 800, color: INK, letterSpacing: "-0.035em" }}>
          מדבר <span style={{ display: "inline-block", transform: `scale(${hebrew})` }}>עברית.</span>
        </Slam>
      </div>
      <div style={{ position: "absolute", top: 900, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Slam f={f} at={SAY[1]} style={{ fontSize: 84, fontWeight: 700, color: MUTED, letterSpacing: "-0.02em" }}>
          לא ״הקישו 1״.
        </Slam>
      </div>
    </AbsoluteFill>
  )
}

export function PressOne({ safeZones }: { safeZones: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: "#050605" }}>
      {f < BLACKOUT && (
        <Glitch f={f} at={GLITCH} dur={BLACKOUT - GLITCH} id="menu-break" strength={1.2}>
          <Terminal f={f} />
        </Glitch>
      )}
      {f >= BLACKOUT && f < CHAT && <AbsoluteFill style={{ background: "#000" }} />}
      {f >= CHAT && f < COMPARE && <Chat f={f} />}
      {f >= COMPARE && f < END && <Compare f={f} />}
      {f >= END && <EndCard f={f - END} />}
      <Flash f={f} hits={[BLACKOUT, CHAT, COMPARE, END]} dur={7} />
      <Grain id="press-one-grain" opacity={0.06} />
      <Track cues={cues} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
