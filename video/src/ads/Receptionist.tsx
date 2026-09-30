import { Check, Phone } from "lucide-react"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { EndCard } from "../components/EndCard"
import { Grain } from "../components/Grain"
import { KineticText } from "../components/KineticText"
import { SafeZones } from "../components/SafeZones"
import { FONT_STACK } from "../fonts"
import { Flash, Ripple, SLAM_LAND, Slam, Whip, punch, rand, shake } from "../fx"
import { Track, cueSheet } from "../sound"
import { CHANNEL, NIGHT, ON_DARK, ON_DARK_MUTED, clamp01, ease } from "../theme"
import lines from "../voice/lines.json"

/** "המזכירה של 19:00" — the voice agent. The clinic's receptionist has gone
 *  home; the phone rings in the dark office and the agent answers a real
 *  call (ElevenLabs voices, src/voice), books the slot, sends the
 *  confirmation, and closes. Then the same at 21:40, 06:55 and on a holiday. */

const BLUE = CHANNEL.phone.color
const BLUE_LIGHT = `color-mix(in srgb, ${BLUE} 62%, white)`

// ── timeline (frames at 30 fps) ────────────────────────────────────────────
const LAMP_OFF = 60
const RINGS = [88, 124]
const RING_SLAM = 92
const PICKUP = 150
const CALL_IN = 154 // the camera dives into the phone's display
const CALL_AT = 160 // the call scene is on screen
const BOOK = { in: 640, slot: 652, sms: 668, pin: 684 } // the booking, between C2 and C4
const HANGUP = 824
const MONTAGE = [864, 896, 928] // each call gets 32 frames
const TAGLINE = 960
const END = 1010
export const RECEPTIONIST_FRAMES = 1100

type LineId = keyof typeof lines

/** The call, in order. `[...]` marks the words that carry the booking — they
 *  light up as they are said. The agent's name-taking lines were cut (their
 *  answer could not be recorded), so the booking itself shows on screen. */
const CALL: { id: LineId; at: number; text: string }[] = [
  { id: "a1-answer", at: 160, text: "[מרפאת השיניים], ערב טוב! איך אפשר לעזור?" },
  { id: "c1-ask", at: 270, text: "היי, ערב טוב... אני צריך לקבוע [בדיקה וניקוי אבנית]. יש משהו [מחר]?" },
  { id: "a2-offer", at: 401, text: "בטח. מחר יש לי פנוי [בעשר וחצי] בבוקר, או [בארבע] אחר הצהריים. מה נוח לך?" },
  { id: "c2-pick", at: 606, text: "[עשר וחצי], מעולה." },
  { id: "c4-thanks", at: 690, text: "וואו, מושלם. תודה רבה!" },
  { id: "a5-bye", at: 752, text: "בשמחה! ערב טוב." },
]

type Word = { text: string; group: number; marked: boolean; suffix: string; at: number }

/** Split a line into words and give each the frame it is spoken on: the
 *  line's loudness is integrated over time and each word starts where its
 *  share of the letters is reached, so pauses in the voice hold the words. */
function wordsOf(text: string, envelope: number[], at: number): Word[] {
  const words: Omit<Word, "at">[] = []
  let group = 0
  for (const m of text.matchAll(/\[([^\]]+)\]([^\s[]*)|(\S+)/g)) {
    if (m[1]) {
      const parts = m[1].split(" ")
      parts.forEach((w, i) => words.push({ text: w, group, marked: true, suffix: i === parts.length - 1 ? m[2] : "" }))
    } else {
      words.push({ text: m[3], group, marked: false, suffix: "" })
    }
    group++
  }
  const cum: number[] = []
  envelope.reduce((acc, e, i) => (cum[i] = acc + e ** 1.5), 0)
  const total = cum[cum.length - 1] || 1
  const letters = words.reduce((n, w) => n + w.text.length + w.suffix.length, 0)
  let before = 0
  return words.map((w) => {
    const target = (before / letters) * total
    before += w.text.length + w.suffix.length
    const i = cum.findIndex((c) => c >= target)
    return { ...w, at: at + Math.max(0, i) - 2 }
  })
}

const CALL_WORDS = CALL.map((l) => wordsOf(l.text, lines[l.id].envelope, l.at))

const lineEnd = (i: number) => CALL[i].at + lines[CALL[i].id].frames

// ── sound ──────────────────────────────────────────────────────────────────
const { sfx, file, cues } = cueSheet("desk")
sfx(0, "office", 1, LAMP_OFF + 1) // the lamp's click cuts the room's hum
for (const at of [0, 30]) sfx(at, "tick", 1)
sfx(LAMP_OFF, "lamp", 0.9)
sfx(LAMP_OFF + 10, "door", 0.8)
for (const at of RINGS) {
  sfx(at, "ring", 0.7)
  sfx(at, "zap", 0.45)
}
sfx(RING_SLAM + SLAM_LAND, "slam", 0.8)
sfx(PICKUP, "pickup", 0.9)
sfx(CALL_IN + 2, "line", 0.7)
sfx(CALL_IN + 2, "linebed", 0.55, HANGUP - CALL_IN)
for (const l of CALL) file(l.at, `voice/${l.id}.wav`, 1)
sfx(BOOK.in, "whip", 0.35)
sfx(BOOK.slot, "slot", 0.85)
sfx(BOOK.slot + 2, "confirm", 0.45)
sfx(BOOK.sms, "sms", 0.8)
sfx(HANGUP, "hangup", 0.85)
sfx(HANGUP + 14, "confirm", 0.5)
for (const at of MONTAGE) {
  sfx(at - 4, "whip", 0.55)
  sfx(at + 2, "ring", 0.6)
  sfx(at + 16, "sms", 0.5)
}
sfx(TAGLINE - 4, "whip", 0.5)
sfx(TAGLINE + SLAM_LAND, "slam", 0.85)
sfx(TAGLINE + 22 + SLAM_LAND, "slam", 0.75)
sfx(END, "trill", 0.8)

// ── 1–2 · the office closes, the phone rings ───────────────────────────────

function Lamp({ on }: { on: number }) {
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cone" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.34 * on} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3 * on} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the pool of light on the desk and the cone that throws it */}
      <ellipse cx={520} cy={1170} rx={430} ry={120} fill="url(#pool)" />
      <polygon points="262,744 372,700 820,1170 160,1180" fill="url(#cone)" />
      {/* the lamp: base, arm, shade */}
      <ellipse cx={170} cy={1168} rx={96} ry={20} fill="#1d1d1d" stroke="#2c2c2c" strokeWidth={3} />
      <path d="M170 1160 L128 910 L292 736" stroke="#2a2a2a" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={128} cy={910} r={14} fill="#2f2f2f" />
      <path d="M232 690 L392 640 L420 700 L262 760 Z" fill="#262626" stroke="#343434" strokeWidth={3} strokeLinejoin="round" />
      <path d="M262 758 L420 700" stroke={`rgba(255,255,255,${0.85 * on})`} strokeWidth={6} strokeLinecap="round" />
    </svg>
  )
}

function DeskPhone({ f, lit, label }: { f: number; lit: number; label: string }) {
  const keys = Array.from({ length: 12 }, (_, i) => i)
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="lcd-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={BLUE} stopOpacity={0.55 * lit} />
          <stop offset="1" stopColor={BLUE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={600} cy={1060} rx={420} ry={260} fill="url(#lcd-glow)" />
      {/* the body */}
      <path d="M430 980 Q432 964 450 962 L750 962 Q768 964 770 980 L800 1150 Q800 1166 782 1166 L418 1166 Q400 1166 400 1150 Z" fill="#1f1f1f" stroke="#303030" strokeWidth={3} />
      {/* the handset in its cradle */}
      <path d="M410 918 Q400 900 420 892 L500 884 Q520 884 522 900 L522 912 L678 912 L678 900 Q680 884 700 884 L780 892 Q800 900 790 918 L772 958 Q766 968 752 966 L700 960 Q690 958 690 946 L510 946 Q510 958 500 960 L448 966 Q434 968 428 958 Z" fill="#242424" stroke="#353535" strokeWidth={3} />
      {/* the display */}
      <rect x={470} y={986} width={260} height={62} rx={10} fill={lit > 0.02 ? BLUE : "#121212"} opacity={0.25 + 0.75 * lit} stroke="#333" strokeWidth={2} />
      <text x={600} y={1027} textAnchor="middle" fontFamily="Rubik" fontWeight={700} fontSize={28} fill="#fff" opacity={lit} direction="rtl">
        {label}
      </text>
      {/* the keypad */}
      {keys.map((k) => {
        const col = k % 3
        const row = Math.floor(k / 3)
        const glow = lit * (0.25 + 0.2 * rand(k * 3.1 + Math.floor(f / 6)))
        return (
          <rect key={k} x={532 + col * 48} y={1064 + row * 24} width={38} height={16} rx={5} fill={`rgba(120,160,255,${glow})`} stroke="#343434" strokeWidth={2} />
        )
      })}
    </svg>
  )
}

function Office({ f }: { f: number }) {
  // The lamp flickers once and goes out.
  const flicker = f >= LAMP_OFF && f < LAMP_OFF + 5 ? (f - LAMP_OFF === 2 ? 0.6 : 0) : 1
  const on = f < LAMP_OFF ? 1 : f < LAMP_OFF + 5 ? flicker : 0
  const ringing = RINGS.some((at) => f >= at)
  const pulse = RINGS.reduce((v, at) => (f >= at && f < at + 34 ? Math.max(v, 0.75 + 0.25 * Math.sin((f - at) * 1.3)) : v), 0)
  const lit = f >= PICKUP ? 1 : ringing ? Math.max(0.55, pulse) : 0
  const label = f >= PICKUP ? "הסוכן עונה" : "שיחה נכנסת"
  // Each ring rattles the phone on the desk.
  const vib = RINGS.some((at) => f >= at && f < at + 30) ? shake(f, RINGS, 5, 30) : "none"
  // The dive into the display.
  const dive = clamp01((f - CALL_IN) / 6)
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #151515 0%, #0d0d0d 58%, #080808 60%, #050505 100%)`,
        transform: `scale(${1 + dive ** 2 * 7})`,
        transformOrigin: "600px 1017px",
        filter: dive > 0 ? `blur(${dive * 10}px)` : undefined,
      }}
    >
      {/* the wall, lit by the lamp while it is on */}
      <AbsoluteFill
        style={{ background: "radial-gradient(70% 38% at 30% 42%, rgba(255,255,255,0.09), transparent 70%)", opacity: on }}
      />
      {/* the desk's edge */}
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, height: 4, background: `rgba(255,255,255,${0.05 + 0.08 * on})` }} />
      {/* the wall clock, an LED that stays on in the dark */}
      <div
        style={{
          position: "absolute",
          top: 640,
          insetInlineStart: 90,
          fontSize: 112,
          fontWeight: 300,
          letterSpacing: "0.04em",
          color: ON_DARK,
          opacity: 0.2 + 0.1 * on,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        19<span style={{ opacity: f % 30 < 15 ? 1 : 0.25 }}>:</span>02
      </div>
      <Lamp on={on} />
      <AbsoluteFill style={{ transform: vib }}>
        <DeskPhone f={f} lit={lit} label={label} />
      </AbsoluteFill>
      <Ripple f={f} hits={RINGS} x={600} y={1017} color={BLUE_LIGHT} size={1300} dur={32} />
      {/* headlines */}
      <div style={{ position: "absolute", top: 320, left: 0, right: 0 }}>
        {f < RINGS[0] && (
          <KineticText lines={["המזכירה", "הלכה הביתה."]} f={f} inAt={6} outAt={RINGS[0] - 10} size={112} color={ON_DARK} />
        )}
        {f >= RING_SLAM && (
          <Slam f={f} at={RING_SLAM} style={{ textAlign: "center", fontSize: 128, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.035em" }}>
            הטלפון לא.
          </Slam>
        )}
      </div>
      <Flash f={f} hits={RINGS} dur={6} color={BLUE_LIGHT} max={0.35} />
    </AbsoluteFill>
  )
}

// ── 3 · the call ───────────────────────────────────────────────────────────

const activeLine = (f: number) =>
  CALL.findIndex((l, i) => f >= l.at && f < lineEnd(i))

function Wave({ f }: { f: number }) {
  const i = activeLine(f)
  const agent = i >= 0 && lines[CALL[i].id].speaker === "agent"
  const level = (k: number) => {
    if (k < 0) return 0
    const env = lines[CALL[k].id].envelope
    const d = f - CALL[k].at
    return Math.max(env[d] ?? 0, 0.6 * (env[d - 1] ?? 0), 0.35 * (env[d - 2] ?? 0))
  }
  const amp = f < HANGUP ? level(i) : 0
  const color = agent ? BLUE_LIGHT : ON_DARK
  const bars = 46
  return (
    <div style={{ position: "absolute", top: 450, left: 70, right: 70, height: 170, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {Array.from({ length: bars }, (_, b) => {
        const x = (b - (bars - 1) / 2) / (bars * 0.3)
        const shape = Math.exp(-x * x)
        const jitter = 0.45 + 0.55 * rand(b * 3.7 + Math.floor(f) * 0.91)
        const h = 10 + 160 * amp * shape * jitter
        return (
          <div
            key={b}
            style={{
              width: 10,
              height: h,
              borderRadius: 999,
              background: color,
              opacity: 0.35 + 0.65 * Math.min(1, amp * 2 + 0.1),
              boxShadow: agent && amp > 0.1 ? `0 0 ${24 * amp}px ${BLUE}` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

function CallHeader({ f }: { f: number }) {
  const secs = Math.floor(Math.max(0, Math.min(f, HANGUP) - CALL_AT) / 30)
  const ended = f >= HANGUP
  return (
    <div style={{ position: "absolute", top: 292, left: 65, right: 65, display: "flex", alignItems: "center", gap: 24 }}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 999,
          background: ended ? "#2a2a2a" : BLUE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: ended ? undefined : `0 0 40px -6px ${BLUE}`,
        }}
      >
        <Phone size={44} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 42, fontWeight: 700, color: ON_DARK }}>מרפאת השיניים</div>
        <div style={{ fontSize: 30, color: ON_DARK_MUTED, marginTop: 2 }}>
          {ended ? "השיחה הסתיימה" : "סוכן קולי · עונה בשם המרפאה"}
        </div>
      </div>
      <div dir="ltr" style={{ fontSize: 40, fontWeight: 500, color: ON_DARK, fontVariantNumeric: "tabular-nums" }}>
        00:{String(secs).padStart(2, "0")}
      </div>
    </div>
  )
}

function Caption({ index, f, p }: { index: number; f: number; p: number }) {
  const line = CALL[index]
  const words = CALL_WORDS[index]
  const agent = lines[line.id].speaker === "agent"
  const marks = words.filter((w) => w.marked && words.find((v) => v.group === w.group) === w).map((w) => w.at)
  const scale = punch(f, marks, 0.035, 10)
  const groups: Word[][] = []
  for (const w of words) (groups[w.group] ??= []).push(w)
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${scale})` }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
        <div
          style={{
            padding: "10px 26px",
            borderRadius: 999,
            fontSize: 30,
            fontWeight: 700,
            color: agent ? "#fff" : ON_DARK,
            background: agent ? BLUE : "rgba(255,255,255,0.12)",
          }}
        >
          {agent ? "הסוכן" : "המטופל"}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.26em", rowGap: 10, fontSize: 66, fontWeight: 700, lineHeight: 1.22, letterSpacing: "-0.02em" }}>
        {groups.map((g, gi) => {
          const said = (w: Word) => ease(f, w.at, 5)
          if (!g[0].marked) {
            const w = g[0]
            return (
              <span key={gi} style={{ color: ON_DARK, opacity: 0.16 + 0.84 * said(w), display: "inline-block", transform: `translateY(${(1 - said(w)) * 10}px)` }}>
                {w.text}
              </span>
            )
          }
          const on = said(g[0])
          return (
            <span key={gi} style={{ display: "inline-flex", alignItems: "baseline" }}>
              <span
                style={{
                  display: "inline-flex",
                  columnGap: "0.26em",
                  padding: "0 0.2em",
                  borderRadius: 16,
                  background: `color-mix(in srgb, ${BLUE} ${on * 100}%, transparent)`,
                  color: "#fff",
                  opacity: 0.16 + 0.84 * on,
                  boxShadow: on > 0.5 ? `0 0 44px -10px ${BLUE}` : undefined,
                }}
              >
                {g.map((w, wi) => (
                  <span key={wi} style={{ opacity: 0.3 + 0.7 * said(w) }}>
                    {w.text}
                  </span>
                ))}
              </span>
              <span style={{ color: ON_DARK, opacity: 0.16 + 0.84 * on }}>{g[g.length - 1].suffix}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Slot({ time, text, p }: { time: string; text?: string; p: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, height: 84, borderTop: "2px solid rgba(255,255,255,0.08)" }}>
      <div dir="ltr" style={{ width: 120, fontSize: 32, fontWeight: 500, color: ON_DARK_MUTED, fontVariantNumeric: "tabular-nums" }}>
        {time}
      </div>
      <div style={{ flex: 1, height: 64, position: "relative" }}>
        {text && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              background: BLUE,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 24px",
              fontSize: 32,
              fontWeight: 700,
              opacity: clamp01(p * 2),
              transform: `translateY(${(1 - p) * -60}px) scale(${1 + (1 - p) * 0.12})`,
              boxShadow: `0 20px 50px -20px ${BLUE}`,
            }}
          >
            <Check size={30} strokeWidth={3.2} />
            {text}
          </div>
        )}
      </div>
    </div>
  )
}

function Booking({ f }: { f: number }) {
  const inP = ease(f, BOOK.in, 10)
  const drop = clamp01((f - BOOK.slot + 4) / 4) ** 2 // accelerates into the slot
  const sms = ease(f, BOOK.sms, 10)
  const scale = punch(f, [BOOK.slot], 0.06, 12)
  return (
    <div style={{ position: "absolute", top: 650, left: 90, right: 90, opacity: inP, transform: `translateX(${(1 - inP) * 140}px)` }}>
      <div style={{ transform: `scale(${scale})`, padding: "26px 34px 10px", borderRadius: 32, background: "#161616", border: "2px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 700, color: ON_DARK, marginBottom: 16 }}>
          <span>יומן המרפאה · מחר</span>
          <span style={{ color: BLUE_LIGHT }}>{f >= BOOK.slot ? "עודכן" : "פנוי"}</span>
        </div>
        <Slot time="09:30" p={0} />
        <Slot time="10:30" text="בדיקה וניקוי אבנית" p={drop} />
        <Slot time="11:30" p={0} />
      </div>
      <div
        style={{
          marginTop: 26,
          padding: "26px 30px",
          borderRadius: 28,
          background: "#f7f7f6",
          color: "#111",
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: sms,
          transform: `translateY(${(1 - sms) * 80}px)`,
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 18, background: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Check size={36} strokeWidth={3.2} />
        </div>
        <div>
          <div style={{ fontSize: 26, color: "#6f6f6f" }}>הודעה · מרפאת השיניים</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>התור אושר: מחר 10:30</div>
        </div>
      </div>
    </div>
  )
}

function BookedPin({ p }: { p: number }) {
  return (
    <div style={{ position: "absolute", top: 660, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 30px", borderRadius: 999, background: "rgba(37,99,235,0.18)", border: `2px solid ${BLUE}`, color: ON_DARK, fontSize: 32, fontWeight: 700 }}>
        <Check size={30} strokeWidth={3.2} color={BLUE_LIGHT} />
        נקבע ביומן · מחר 10:30 · אישור נשלח
      </div>
    </div>
  )
}

/** How much of line i's caption is on screen: it enters a few frames before
 *  its line starts and leaves as the next one enters. The booking pushes the
 *  caption of C2 ("עשר וחצי, מעולה.") off early. */
function captionVisibility(i: number, f: number) {
  const enter = ease(f, CALL[i].at - 4, 8)
  const exit = i + 1 < CALL.length ? 1 - ease(f, CALL[i + 1].at - 4, 6) : 1
  const booked = CALL[i].id === "c2-pick" ? 1 - ease(f, BOOK.in - 2, 6) : 1
  return f >= HANGUP ? 0 : enter * exit * booked
}

function Call({ f }: { f: number }) {
  const booking = f >= BOOK.in && f < BOOK.pin + 10
  const pin = ease(f, BOOK.pin, 10)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 40% at 50% 18%, rgba(37,99,235,0.2), transparent 70%), ${NIGHT}` }}>
      <CallHeader f={f} />
      <Wave f={f} />
      {f >= BOOK.pin && <BookedPin p={pin} />}
      <div style={{ position: "absolute", top: 680 + 90 * pin, left: 80, right: 80, height: 460, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {CALL.map((_, i) => {
          const v = captionVisibility(i, f)
          if (v <= 0) return null
          return (
            <div key={i} style={{ position: "absolute", left: 0, right: 0 }}>
              <Caption index={i} f={f} p={v} />
            </div>
          )
        })}
        {f >= HANGUP && <HungUp f={f - HANGUP} />}
      </div>
      {booking && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, BOOK.pin, 8) }}>
          <Booking f={f} />
        </AbsoluteFill>
      )}
      <Flash f={f} hits={[BOOK.slot]} dur={6} color={BLUE_LIGHT} max={0.35} />
    </AbsoluteFill>
  )
}

function HungUp({ f }: { f: number }) {
  const p = ease(f, 10, 12)
  return (
    <div style={{ textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ fontSize: 34, color: ON_DARK_MUTED }}>
        השיחה הסתיימה · <span dir="ltr">00:{String(Math.floor((HANGUP - CALL_AT) / 30)).padStart(2, "0")}</span>
      </div>
      <div style={{ marginTop: 20, fontSize: 84, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
        תור נקבע.
        <br />
        בלי אף אחד במשרד.
      </div>
    </div>
  )
}

// ── 4 · the montage ────────────────────────────────────────────────────────

function Moment({ big, note, f }: { big: string; note: string; f: number }) {
  const check = ease(f, 14, 8)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(80% 40% at 50% 45%, rgba(37,99,235,0.22), transparent 70%), ${NIGHT}` }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 300 }}>
        <Slam f={f} at={2} style={{ fontSize: big.length > 5 ? 190 : 230, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
          <span dir={big.length > 5 ? "rtl" : "ltr"}>{big}</span>
        </Slam>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 16, fontSize: 42, fontWeight: 700, color: ON_DARK }}>
          <span style={{ opacity: 0.7 }}>שיחה נכנסת</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 24px",
              borderRadius: 999,
              background: BLUE,
              color: "#fff",
              opacity: check,
              transform: `scale(${0.8 + 0.2 * check})`,
            }}
          >
            <Check size={32} strokeWidth={3.2} />
            {note}
          </span>
        </div>
      </AbsoluteFill>
      <Ripple f={f} hits={[2]} x={540} y={700} color={BLUE_LIGHT} size={1100} dur={26} />
    </AbsoluteFill>
  )
}

function Montage({ f }: { f: number }) {
  const moments: [string, string][] = [
    ["21:40", "נענתה"],
    ["06:55", "נענתה"],
    ["גם בחג", "נענתה"],
  ]
  const scene = (k: number) => <Moment big={moments[k][0]} note={moments[k][1]} f={f - MONTAGE[k]} />
  if (f < MONTAGE[1] - 4) return <Whip f={f} at={MONTAGE[0] - 4} dur={8} id="w0" from={<Call f={f} />} to={scene(0)} />
  if (f < MONTAGE[2] - 4) return <Whip f={f} at={MONTAGE[1] - 4} dur={8} id="w1" from={scene(0)} to={scene(1)} />
  return <Whip f={f} at={MONTAGE[2] - 4} dur={8} id="w2" from={scene(1)} to={scene(2)} />
}

// ── 5 · the tagline and the end card ───────────────────────────────────────

function Tagline({ f }: { f: number }) {
  const style = { textAlign: "center", fontSize: 124, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.035em", lineHeight: 1.05 } as const
  const tag = (
    <AbsoluteFill style={{ background: NIGHT, justifyContent: "center", paddingBottom: 320, transform: shake(f, [TAGLINE + SLAM_LAND, TAGLINE + 22 + SLAM_LAND], 10, 10) }}>
      <Slam f={f} at={TAGLINE} style={style}>
        מזכירה שלא
      </Slam>
      <Slam f={f} at={TAGLINE + 22} style={{ ...style, color: BLUE_LIGHT }}>
        הולכת הביתה.
      </Slam>
    </AbsoluteFill>
  )
  const last = <Moment big="גם בחג" note="נענתה" f={f - MONTAGE[2]} />
  return <Whip f={f} at={TAGLINE - 4} dur={8} id="w3" from={last} to={tag} />
}

/** Scenes take the ad's own frame, so every timing constant above is absolute. */
export function Receptionist({ safeZones }: { safeZones: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: NIGHT }}>
      {f < CALL_AT && <Office f={f} />}
      {f >= CALL_AT && f < MONTAGE[0] - 4 && <Call f={f} />}
      {f >= MONTAGE[0] - 4 && f < TAGLINE - 4 && <Montage f={f} />}
      {f >= TAGLINE - 4 && f < END && <Tagline f={f} />}
      {f >= END && <EndCard f={f - END} />}
      <Flash f={f} hits={[CALL_AT, END]} dur={8} max={0.85} />
      <Grain id="receptionist-grain" opacity={0.07} />
      <Track cues={cues} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
