import { Check, Clock, Phone } from "lucide-react"
import { AbsoluteFill, getInputProps, spring, useCurrentFrame } from "remotion"
import { EndCard } from "../components/EndCard"
import { Grain } from "../components/Grain"
import { KineticText } from "../components/KineticText"
import { CURTAIN_EDGE, LiquidCurtain } from "../components/LiquidCurtain"
import { SafeZones } from "../components/SafeZones"
import { CHANNEL_ICON } from "../components/icons"
import { FONT_STACK } from "../fonts"
import { Flash, Ripple, SLAM_LAND, Slam, Whip, decay, punch, rand, shake } from "../fx"
import { BRAND_STING, Track, cueSheet } from "../sound"
import { CHANNEL, CURTAIN_EASE, HAIRLINE, INK, LIVE, MUTED, NIGHT, ON_DARK, SURFACE, WHITE, WIDTH, clamp01, ease } from "../theme"
import linesAzure from "../voice/lines-azure.json"
import linesEleven from "../voice/lines.json"

/** "המזכירה של 19:00" — the voice agent. The clinic's receptionist has gone
 *  home; the phone rings in the dark office and the agent answers a real
 *  call (ElevenLabs voices, src/voice), books the slot, sends the
 *  confirmation, and closes. Then the same at 21:40, 06:55 and on a holiday. */

const BLUE = CHANNEL.phone.color
const BLUE_LIGHT = `color-mix(in srgb, ${BLUE} 62%, white)`

// ── voice ──────────────────────────────────────────────────────────────────
// The call comes in two takes of the same six lines: ElevenLabs ("eleven")
// and Azure Speech ("azure": Hila and Avri). Pick with --props='{"voice":"azure"}'.
// Every timing after the first line is derived from the take's line lengths.
export type Voice = "eleven" | "azure"
type LineId = keyof typeof linesEleven
type Take = Record<LineId, { speaker: string; frames: number; envelope: number[] }>
const TAKES: Record<Voice, { lines: Take; dir: string }> = {
  eleven: { lines: linesEleven, dir: "voice" },
  azure: { lines: linesAzure, dir: "voice-azure" },
}

// ── timeline (frames at 30 fps) ────────────────────────────────────────────
const LAMP_OFF = 60
const RINGS = [88, 124]
const RING_SLAM = 92
const PICKUP = 150
const CALL_IN = 154 // the camera dives into the phone's display
const CALL_AT = 160 // the call scene is on screen

/** The call, in order. `[...]` marks the words that carry the booking; they
 *  are set bold in blue within the sentence. The agent's name-taking lines
 *  were cut (their answer could not be recorded), so the booking itself
 *  shows on screen. */
const TEXTS: [LineId, string][] = [
  ["a1-answer", "[מרפאת השיניים], ערב טוב! איך אפשר לעזור?"],
  ["c1-ask", "היי, ערב טוב... אני צריך לקבוע [בדיקה וניקוי אבנית]. יש משהו [מחר]?"],
  ["a2-offer", "בטח. מחר יש לי פנוי [בעשר וחצי] בבוקר, או [בארבע] אחר הצהריים. מה נוח לך?"],
  ["c2-pick", "[עשר וחצי], מעולה."],
  ["c4-thanks", "וואו, מושלם. תודה רבה!"],
  ["a5-bye", "בשמחה! ערב טוב."],
]

/** Where everything lands for a take: each line starts a beat after the
 *  last one ends, the booking sits between "עשר וחצי" and the thanks, and
 *  the CRM, tagline and end card follow the hang-up. */
export function plan(voice: Voice) {
  const L = TAKES[voice].lines
  const at: Partial<Record<LineId, number>> = {}
  let cursor = CALL_AT
  const place = (id: LineId, gap: number) => {
    at[id] = cursor + gap
    cursor = at[id]! + L[id].frames
  }
  place("a1-answer", 0)
  place("c1-ask", 12)
  place("a2-offer", 8)
  place("c2-pick", 10)
  const bookIn = cursor + 3
  const BOOK = { in: bookIn, slot: bookIn + 12, sms: bookIn + 28, pin: bookIn + 44 }
  cursor = bookIn + 50
  place("c4-thanks", 0)
  place("a5-bye", 8)
  const HANGUP = cursor + 9
  // After the call, the CRM: a black curtain carries it in, the camera sits
  // on the call's card while its summary writes itself, pulls back to the
  // board as the card moves to "נקבע תור", then whips to the night's log.
  const CRM = {
    in: HANGUP + 28, // the curtain starts across
    sweep: 22,
    type: HANGUP + 60, // the summary starts typing
    tags: [HANGUP + 90, HANGUP + 95, HANGUP + 100],
    zoomOut: HANGUP + 120,
    move: HANGUP + 144, // the card leaves "פנייה חדשה"
    land: HANGUP + 158, // …and lands in "נקבע תור"
    autos: [HANGUP + 164, HANGUP + 173, HANGUP + 182],
    log: HANGUP + 200, // the whip to the night's log
    rows: HANGUP + 210,
    rowGap: 7,
  }
  const TAGLINE = HANGUP + 274
  const END = TAGLINE + 48
  return {
    lines: L,
    dir: TAKES[voice].dir,
    CALL: TEXTS.map(([id, text]) => ({ id, at: at[id]!, text })),
    BOOK,
    HANGUP,
    CRM,
    TAGLINE,
    END,
    frames: END + 96,
  }
}

/** Read once at load: the render's input props pick the take. */
const VOICE: Voice = getInputProps<{ voice?: Voice }>().voice === "azure" ? "azure" : "eleven"
const { lines, dir: VOICE_DIR, CALL, BOOK, HANGUP, CRM, TAGLINE, END } = plan(VOICE)
export const receptionistFrames = (voice: Voice) => plan(voice).frames

const lineEnd = (i: number) => CALL[i].at + lines[CALL[i].id].frames

// What the CRM shows after the call.
const SUMMARY = "מטופל חדש. ביקש בדיקה וניקוי אבנית למחר. נקבע ל-10:30, ואישור נשלח ב-SMS."
const SUMMARY_CPS = 2.5
const SUMMARY_FRAMES = Math.ceil(SUMMARY.length / SUMMARY_CPS)
const LOG_ROWS: { time: string; channel: "phone" | "whatsapp"; what: string; done: string; booked: boolean }[] = [
  { time: "19:02", channel: "phone", what: "בדיקה וניקוי אבנית", done: "נקבע · מחר 10:30", booked: true },
  { time: "21:40", channel: "phone", what: "כאב שן, דחוף", done: "נקבע · מחר 08:30", booked: true },
  { time: "23:15", channel: "whatsapp", what: "כמה עולה הלבנה?", done: "נשלח מחיר", booked: false },
  { time: "06:55", channel: "phone", what: "להזיז תור", done: "הוזז · יום ה׳ 12:00", booked: true },
  { time: "חג", channel: "phone", what: "תור לבדיקה לילד", done: "נקבע · יום א׳ 16:00", booked: true },
]

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
for (const l of CALL) file(l.at, `${VOICE_DIR}/${l.id}.wav`, 1)
sfx(BOOK.in, "whip", 0.35)
sfx(BOOK.slot, "slot", 0.85)
sfx(BOOK.slot + 2, "confirm", 0.45)
sfx(BOOK.sms, "sms", 0.8)
sfx(HANGUP, "hangup", 0.85)
sfx(HANGUP + 14, "confirm", 0.5)
sfx(CRM.in, "sweep", 0.8)
sfx(CRM.in + 6, "crmbed", 0.9, TAGLINE - CRM.in - 6) // cut dead on the tagline
for (let at = CRM.type; at < CRM.type + SUMMARY_FRAMES; at += 2) sfx(at, "type", 0.8)
for (const at of CRM.tags) sfx(at, "pop", 0.75)
sfx(CRM.zoomOut, "whip", 0.5)
sfx(CRM.move, "whip", 0.4)
sfx(CRM.land, "drop", 0.8)
for (const at of CRM.autos) sfx(at, "blip", 0.75)
sfx(CRM.log - 4, "whip", 0.55)
LOG_ROWS.forEach((_, i) => sfx(CRM.rows + i * CRM.rowGap, "blip", 0.65))
sfx(TAGLINE + SLAM_LAND, "slam", 0.85)
sfx(TAGLINE + 20 + SLAM_LAND, "slam", 0.75)
file(END, BRAND_STING, 0.9)

// ── 1–2 · the office closes, the phone rings ───────────────────────────────

function Lamp({ on }: { on: number }) {
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cone" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.95 * on} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity={0.95 * on} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the pool of light on the desk and the cone that throws it */}
      <ellipse cx={520} cy={1170} rx={430} ry={120} fill="url(#pool)" />
      <polygon points="262,744 372,700 820,1170 160,1180" fill="url(#cone)" />
      {/* the lamp: base, arm, shade */}
      <ellipse cx={170} cy={1168} rx={96} ry={20} fill={INK} />
      <path d="M170 1160 L128 910 L292 736" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={128} cy={910} r={14} fill={INK} />
      <path d="M232 690 L392 640 L420 700 L262 760 Z" fill={INK} strokeLinejoin="round" />
      <path d="M262 758 L420 700" stroke={`rgba(255,255,255,${0.9 * on})`} strokeWidth={6} strokeLinecap="round" />
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
      <ellipse cx={600} cy={1172} rx={250} ry={20} fill="rgba(17,17,17,0.16)" />
      {/* the body */}
      <path d="M430 980 Q432 964 450 962 L750 962 Q768 964 770 980 L800 1150 Q800 1166 782 1166 L418 1166 Q400 1166 400 1150 Z" fill={WHITE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* the handset in its cradle */}
      <path d="M410 918 Q400 900 420 892 L500 884 Q520 884 522 900 L522 912 L678 912 L678 900 Q680 884 700 884 L780 892 Q800 900 790 918 L772 958 Q766 968 752 966 L700 960 Q690 958 690 946 L510 946 Q510 958 500 960 L448 966 Q434 968 428 958 Z" fill={SURFACE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* the display */}
      <rect x={470} y={986} width={260} height={62} rx={10} fill={lit > 0.02 ? BLUE : INK} opacity={lit > 0.02 ? 0.35 + 0.65 * lit : 1} />
      <text x={600} y={1027} textAnchor="middle" fontFamily="Rubik" fontWeight={700} fontSize={28} fill="#fff" opacity={lit} direction="rtl">
        {label}
      </text>
      {/* the keypad */}
      {keys.map((k) => {
        const col = k % 3
        const row = Math.floor(k / 3)
        const glow = lit * (0.25 + 0.2 * rand(k * 3.1 + Math.floor(f / 6)))
        return (
          <rect key={k} x={532 + col * 48} y={1064 + row * 24} width={38} height={16} rx={5} fill={`rgba(37,99,235,${0.06 + glow})`} stroke={INK} strokeWidth={2.5} />
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
        background: `linear-gradient(180deg, #ffffff 0%, #fbfbfa 58%, #f1f0ed 60%, #ebeae6 100%)`,
        transform: `scale(${1 + dive ** 2 * 7})`,
        transformOrigin: "600px 1017px",
        filter: dive > 0 ? `blur(${dive * 10}px)` : undefined,
      }}
    >
      {/* the wall, lit by the lamp while it is on */}
      <AbsoluteFill
        style={{ background: "radial-gradient(70% 38% at 30% 42%, rgba(255,255,255,0.9), transparent 70%)", opacity: on }}
      />
      {/* the room dims when the lamp goes off */}
      <AbsoluteFill style={{ background: INK, opacity: (1 - on) * 0.045 }} />
      {/* the desk's edge */}
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, height: 4, background: "rgba(17,17,17,0.14)" }} />
      {/* the wall clock */}
      <div
        style={{
          position: "absolute",
          top: 640,
          insetInlineStart: 90,
          fontSize: 112,
          fontWeight: 300,
          letterSpacing: "0.04em",
          color: INK,
          opacity: 0.3 + 0.08 * on,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        19<span style={{ opacity: f % 30 < 15 ? 1 : 0.25 }}>:</span>02
      </div>
      <Lamp on={on} />
      <AbsoluteFill style={{ transform: vib }}>
        <DeskPhone f={f} lit={lit} label={label} />
      </AbsoluteFill>
      <Ripple f={f} hits={RINGS} x={600} y={1017} color={BLUE} size={1300} dur={32} />
      {/* headlines */}
      <div style={{ position: "absolute", top: 320, left: 0, right: 0 }}>
        {f < RINGS[0] && (
          <KineticText lines={["המזכירה", "הלכה הביתה."]} f={f} inAt={6} outAt={RINGS[0] - 10} size={112} color={INK} />
        )}
        {f >= RING_SLAM && (
          <Slam f={f} at={RING_SLAM} style={{ textAlign: "center", fontSize: 128, fontWeight: 800, color: INK, letterSpacing: "-0.035em" }}>
            הטלפון לא.
          </Slam>
        )}
      </div>
      <Flash f={f} hits={RINGS} dur={6} color={BLUE_LIGHT} max={0.35} />
    </AbsoluteFill>
  )
}

// ── 3 · the call ───────────────────────────────────────────────────────────

const activeLine = (f: number) => CALL.findIndex((l, i) => f >= l.at && f < lineEnd(i))

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
  const color = agent ? BLUE : INK
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
              background: amp > 0.02 ? color : "rgba(17,17,17,0.18)",
              opacity: 0.45 + 0.55 * Math.min(1, amp * 2 + 0.1),
              boxShadow: agent && amp > 0.1 ? `0 0 ${24 * amp}px -4px ${BLUE}` : undefined,
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
          background: ended ? INK : BLUE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: WHITE,
          boxShadow: ended ? undefined : `0 18px 40px -12px ${BLUE}`,
        }}
      >
        <Phone size={44} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 42, fontWeight: 700, color: INK }}>מרפאת השיניים</div>
        <div style={{ fontSize: 30, color: MUTED, marginTop: 2 }}>{ended ? "השיחה הסתיימה" : "סוכן קולי · עונה בשם המרפאה"}</div>
      </div>
      <div dir="ltr" style={{ fontSize: 40, fontWeight: 500, color: INK, fontVariantNumeric: "tabular-nums" }}>
        00:{String(secs).padStart(2, "0")}
      </div>
    </div>
  )
}

/** A sentence as segments, so the words that carry the booking can be set apart. */
const segments = (text: string) =>
  text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .map((t) => (t.startsWith("[") ? { text: t.slice(1, -1), marked: true } : { text: t, marked: false }))

/** Frame on which line i's sentence pops onto the screen: just ahead of its voice. */
const ENTRY = (i: number) => CALL[i].at - 2

/** One sentence, whole. It lands oversized and blurred, snaps to size with a
 *  glow and a flash of brightness, and stays on the thread. */
function Bubble({ index, f }: { index: number; f: number }) {
  const line = CALL[index]
  const agent = lines[line.id].speaker === "agent"
  const d = f - ENTRY(index)
  const p = spring({ frame: d, fps: 30, config: { damping: 15, stiffness: 420, mass: 0.55 } })
  const glow = decay(f, [ENTRY(index)], 10)
  return (
    <div
      style={{
        alignSelf: agent ? "flex-end" : "flex-start",
        maxWidth: "90%",
        padding: "22px 38px 26px",
        borderRadius: 42,
        borderStartStartRadius: agent ? 42 : 12,
        borderStartEndRadius: agent ? 12 : 42,
        background: agent ? BLUE : WHITE,
        color: agent ? WHITE : INK,
        border: agent ? `2px solid ${BLUE}` : `2px solid ${HAIRLINE}`,
        boxShadow: `0 26px 50px -30px ${agent ? BLUE : "rgba(17,17,17,0.5)"}, 0 0 ${80 * glow}px ${glow * 6}px ${agent ? "rgba(37,99,235,0.55)" : "rgba(17,17,17,0.18)"}`,
        opacity: clamp01(d < 0 ? 0 : p * 2),
        transform: `scale(${1 + (1 - Math.min(p, 1.2)) * 0.18})`,
        transformOrigin: agent ? "left bottom" : "right bottom",
        filter: `brightness(${1 + 0.4 * glow}) blur(${Math.max(0, (1 - p) * 9)}px)`,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.68, marginBottom: 6 }}>{agent ? "הסוכן" : "המטופל"}</div>
      <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.32, letterSpacing: "-0.01em" }}>
        {segments(line.text).map((seg, k) =>
          seg.marked ? (
            <span key={k} style={{ padding: "0 0.16em", borderRadius: 12, fontWeight: 800, background: agent ? "rgba(255,255,255,0.24)" : "rgba(37,99,235,0.13)", color: agent ? WHITE : BLUE }}>
              {seg.text}
            </span>
          ) : (
            <span key={k}>{seg.text}</span>
          ),
        )}
      </div>
    </div>
  )
}

/** A run of lines as a conversation: the newest at the bottom of the safe
 *  band, older ones gliding up and out under a soft fade at the top. */
function Thread({ f, from, to, top, opacity = 1 }: { f: number; from: number; to: number; top: number; opacity?: number }) {
  const zoom = punch(f, CALL.slice(from, to).map((_, k) => ENTRY(from + k)), 0.018, 10)
  return (
    <div
      style={{
        position: "absolute",
        top,
        bottom: 1920 - 1236,
        left: 65,
        right: 65,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent 0px, black 90px)",
        opacity,
        transform: `scale(${zoom})`,
        transformOrigin: "50% 90%",
      }}
    >
      {CALL.slice(from, to).map((_, k) => {
        const i = from + k
        if (f < ENTRY(i)) return null
        return (
          <div key={i} style={{ display: "grid", gridTemplateRows: `${ease(f, ENTRY(i), 7)}fr` }}>
            <div style={{ minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 22 }}>
              <Bubble index={i} f={f} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Slot({ time, text, p }: { time: string; text?: string; p: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, height: 84, borderTop: `2px solid ${HAIRLINE}` }}>
      <div dir="ltr" style={{ width: 120, fontSize: 32, fontWeight: 500, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
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
              color: WHITE,
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
      <div style={{ transform: `scale(${scale})`, padding: "26px 34px 10px", borderRadius: 32, background: SURFACE, border: `2px solid ${HAIRLINE}`, boxShadow: "0 40px 80px -44px rgba(17,17,17,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 700, color: INK, marginBottom: 16 }}>
          <span>יומן המרפאה · מחר</span>
          <span style={{ color: BLUE }}>{f >= BOOK.slot ? "עודכן" : "פנוי"}</span>
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
          background: WHITE,
          border: `2px solid ${HAIRLINE}`,
          boxShadow: "0 30px 60px -36px rgba(17,17,17,0.45)",
          color: INK,
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: sms,
          transform: `translateY(${(1 - sms) * 80}px)`,
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 18, background: BLUE, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Check size={36} strokeWidth={3.2} />
        </div>
        <div>
          <div style={{ fontSize: 26, color: MUTED }}>הודעה · מרפאת השיניים</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>התור אושר: מחר 10:30</div>
        </div>
      </div>
    </div>
  )
}

function BookedPin({ p }: { p: number }) {
  return (
    <div style={{ position: "absolute", top: 660, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 30px", borderRadius: 999, background: "rgba(37,99,235,0.1)", border: `2px solid ${BLUE}`, color: INK, fontSize: 32, fontWeight: 700 }}>
        <Check size={30} strokeWidth={3.2} color={BLUE} />
        נקבע ביומן · מחר 10:30 · אישור נשלח
      </div>
    </div>
  )
}

const FIRST_THREAD = 4 // lines 0–3 form the first thread; the booking closes it

function Call({ f }: { f: number }) {
  const booking = f >= BOOK.in && f < BOOK.pin + 10
  const pin = ease(f, BOOK.pin, 10)
  const first = f < BOOK.in ? 1 : 1 - ease(f, BOOK.in - 2, 6) // the first thread leaves for the booking
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 40% at 50% 18%, rgba(37,99,235,0.1), transparent 70%), ${WHITE}` }}>
      <CallHeader f={f} />
      <Wave f={f} />
      {f >= BOOK.pin && <BookedPin p={pin} />}
      {first > 0 && <Thread f={f} from={0} to={FIRST_THREAD} top={650} opacity={first} />}
      {f >= ENTRY(FIRST_THREAD) && f < HANGUP && <Thread f={f} from={FIRST_THREAD} to={CALL.length} top={650 + 90 * pin} />}
      {f >= HANGUP && (
        <div style={{ position: "absolute", top: 770, left: 80, right: 80 }}>
          <HungUp f={f - HANGUP} />
        </div>
      )}
      {booking && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, BOOK.pin, 8) }}>
          <Booking f={f} />
        </AbsoluteFill>
      )}
      <Flash f={f} hits={CALL.map((_, i) => ENTRY(i))} dur={5} color={BLUE} max={0.14} />
      <Flash f={f} hits={[BOOK.slot]} dur={6} color={BLUE} max={0.16} />
    </AbsoluteFill>
  )
}

function HungUp({ f }: { f: number }) {
  const p = ease(f, 10, 12)
  return (
    <div style={{ textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ fontSize: 34, color: MUTED }}>
        השיחה הסתיימה · <span dir="ltr">00:{String(Math.floor((HANGUP - CALL_AT) / 30)).padStart(2, "0")}</span>
      </div>
      <div style={{ marginTop: 20, fontSize: 84, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
        תור נקבע.
        <br />
        בלי אף אחד במשרד.
      </div>
    </div>
  )
}

// ── 4 · the CRM ────────────────────────────────────────────────────────────

const CAMERA = { x: 540, y: 790 } // the screen point the camera looks through
const BOARD = { top: 460, bottom: 940 }
const COL = { right: 555, left: 65, width: 460 } // "פנייה חדשה" on the right, "נקבע תור" on the left
const CARD_TOP = 770
const CARD_H = { compact: 150, open: 250 }

function CardHeader({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.5 }}>
      <div style={{ width: size * 1.7, height: size * 1.7, borderRadius: 999, background: BLUE, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Phone size={size} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, fontSize: size, fontWeight: 700, color: INK }}>שיחה חדשה · 19:02</div>
      <div dir="ltr" style={{ fontSize: size * 0.85, fontWeight: 500, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
        00:22
      </div>
    </div>
  )
}

/** The call's card. Opened, it carries the summary the agent wrote and the
 *  tags it set; closed, it is one card on the board. */
function CallCard({ f, open }: { f: number; open: number }) {
  const typed = Math.max(0, Math.min(SUMMARY.length, Math.floor((f - CRM.type) * SUMMARY_CPS)))
  const typing = f >= CRM.type && typed < SUMMARY.length
  const tags = ["מטופל חדש", "חם", "תור נקבע"]
  return (
    <div style={{ padding: "18px 20px", borderRadius: 20, background: WHITE, border: `2px solid ${HAIRLINE}`, boxShadow: "0 18px 40px -26px rgba(17,17,17,0.45)" }}>
      <CardHeader size={22} />
      <div style={{ marginTop: 10, fontSize: 19, color: MUTED }}>בדיקה וניקוי אבנית · מחר 10:30</div>
      <div style={{ display: "grid", gridTemplateRows: `${open}fr`, opacity: open }}>
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `2px solid ${HAIRLINE}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: BLUE, letterSpacing: "0.06em" }}>סיכום אוטומטי של השיחה</div>
            <div style={{ marginTop: 6, fontSize: 19, lineHeight: 1.4, color: INK, minHeight: 54 }}>
              {SUMMARY.slice(0, typed)}
              {typing && <span style={{ display: "inline-block", width: 9, height: 20, marginInlineStart: 2, background: INK, verticalAlign: "-3px" }} />}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              {tags.map((t, i) => {
                const p = spring({ frame: f - CRM.tags[i], fps: 30, config: { damping: 13, stiffness: 320, mass: 0.5 } })
                return (
                  <span key={t} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 15, fontWeight: 700, background: i === 1 ? INK : `color-mix(in srgb, ${BLUE} 12%, ${WHITE})`, color: i === 1 ? WHITE : BLUE, opacity: clamp01(p * 1.5), transform: `scale(${Math.max(0, p)})` }}>
                    {t}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OtherCard({ name, text, channel }: { name: string; text: string; channel: "whatsapp" | "instagram" }) {
  const Icon = CHANNEL_ICON[channel]
  return (
    <div style={{ padding: "18px 20px", borderRadius: 20, background: WHITE, border: `2px solid ${HAIRLINE}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 37, height: 37, borderRadius: 999, background: CHANNEL[channel].color, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} strokeWidth={2.4} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>{name}</div>
      </div>
      <div style={{ marginTop: 10, fontSize: 19, color: MUTED }}>{text}</div>
    </div>
  )
}

function Column({ x, title, count }: { x: number; title: string; count: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: BOARD.top + 76, width: COL.width, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, fontWeight: 700, color: INK }}>
      <span>{title}</span>
      <span style={{ minWidth: 40, padding: "2px 12px", borderRadius: 999, background: SURFACE, border: `2px solid ${HAIRLINE}`, fontSize: 22, color: MUTED, textAlign: "center" }}>{count}</span>
    </div>
  )
}

function Automation({ text, at, f, done }: { text: string; at: number; f: number; done: boolean }) {
  const p = spring({ frame: f - at, fps: 30, config: { damping: 16, stiffness: 260, mass: 0.6 } })
  if (f < at) return null
  const Icon = done ? Check : Clock
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, height: 66, opacity: clamp01(p * 1.5), transform: `translateX(${(1 - p) * 80}px)` }}>
      <div style={{ width: 46, height: 46, borderRadius: 999, background: done ? BLUE : WHITE, border: done ? "none" : `3px solid ${BLUE}`, color: done ? WHITE : BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={26} strokeWidth={3} />
      </div>
      <span style={{ fontSize: 32, fontWeight: 600, color: INK }}>{text}</span>
    </div>
  )
}

/** The board: one world under a camera that starts close on the call's card. */
function Board({ f }: { f: number }) {
  const out = ease(f, CRM.zoomOut, 20)
  const z = 2 - out
  const focus = { x: COL.right + COL.width / 2, y: CARD_TOP + CARD_H.open / 2 }
  const fx = focus.x + (CAMERA.x - focus.x) * out
  const fy = focus.y + (CAMERA.y - focus.y) * out
  const open = 1 - ease(f, CRM.zoomOut, 14)
  const move = clamp01((f - CRM.move) / (CRM.land - CRM.move))
  const slide = move < 0.5 ? 2 * move * move : 1 - (-2 * move + 2) ** 2 / 2
  const lift = Math.sin(move * Math.PI)
  const landed = f >= CRM.land
  const settle = punch(f, [CRM.land], 0.04, 10)
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${CAMERA.x}px, ${CAMERA.y}px) scale(${z}) translate(${-fx}px, ${-fy}px)` }}>
        {/* the app around the card, which only comes up as the camera pulls back */}
        <div style={{ opacity: out }}>
          <div style={{ position: "absolute", left: 45, right: 45, top: BOARD.top, height: BOARD.bottom - BOARD.top, borderRadius: 32, background: SURFACE, border: `2px solid ${HAIRLINE}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: `2px solid ${HAIRLINE}`, fontSize: 22, fontWeight: 700, color: MUTED }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 13, height: 13, borderRadius: 999, background: "rgba(17,17,17,0.15)" }} />
              ))}
              <span style={{ marginInlineStart: 8 }}>נפוץ' · CRM · מרפאת השיניים</span>
              <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}>
                <span style={{ width: 11, height: 11, borderRadius: 999, background: LIVE }} />
                מחובר
              </span>
            </div>
          </div>
          <Column x={COL.right} title="פנייה חדשה" count={landed ? 1 : 2} />
          <Column x={COL.left} title="נקבע תור" count={landed ? 2 : 1} />
          <div style={{ position: "absolute", left: COL.right, top: 600, width: COL.width }}>
            <OtherCard name="יעל" channel="whatsapp" text="יש לכם חניה קרובה?" />
          </div>
          <div style={{ position: "absolute", left: COL.left, top: 600, width: COL.width }}>
            <OtherCard name="דנה" channel="instagram" text="תור · יום ב׳ 12:00" />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: COL.right - slide * (COL.right - COL.left),
            top: CARD_TOP - lift * 16,
            width: COL.width,
            transform: `scale(${(1 + lift * 0.05) * settle}) rotate(${-lift * 2.5}deg)`,
            filter: lift > 0.05 ? `drop-shadow(0 ${30 * lift}px ${30 * lift}px rgba(17,17,17,0.25))` : undefined,
          }}
        >
          <CallCard f={f} open={open} />
        </div>
      </AbsoluteFill>
      {/* what the system did with it, in screen space under the board */}
      <div style={{ position: "absolute", top: 966, left: 80, right: 80 }}>
        <Automation text="נרשם ביומן · מחר 10:30" at={CRM.autos[0]} f={f} done />
        <Automation text="אישור נשלח ב-SMS" at={CRM.autos[1]} f={f} done />
        <Automation text="תזכורת תישלח יום לפני" at={CRM.autos[2]} f={f} done={false} />
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
        {f < CRM.zoomOut + 2 && <KineticText lines={["כל שיחה נרשמת."]} f={f} inAt={CRM.in + 20} outAt={CRM.zoomOut - 8} size={96} color={INK} />}
        {f >= CRM.zoomOut - 4 && <KineticText lines={["וכל תור נסגר עד הסוף."]} f={f} inAt={CRM.zoomOut} size={76} color={INK} />}
      </div>
      <Flash f={f} hits={[CRM.land]} dur={5} color={BLUE_LIGHT} max={0.25} />
    </AbsoluteFill>
  )
}

function NightLog({ f }: { f: number }) {
  const booked = LOG_ROWS.filter((r) => r.booked).length
  const counters = ease(f, CRM.rows + LOG_ROWS.length * CRM.rowGap, 10)
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      <div style={{ position: "absolute", top: 296, left: 0, right: 0, textAlign: "center" }}>
        <Slam f={f} at={CRM.log + 2} style={{ fontSize: 96, fontWeight: 800, color: INK, letterSpacing: "-0.035em" }}>
          גם בלילה. גם בחג.
        </Slam>
      </div>
      <div style={{ position: "absolute", top: 460, left: 45, right: 45, borderRadius: 32, background: WHITE, border: `2px solid ${HAIRLINE}`, boxShadow: "0 40px 90px -40px rgba(17,17,17,0.35)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "20px 28px", background: SURFACE, borderBottom: `2px solid ${HAIRLINE}`, fontSize: 26, fontWeight: 700, color: INK }}>
          <span>יומן פעילות · מאז שהמשרד נסגר</span>
          <span style={{ marginInlineStart: "auto", fontSize: 24, fontWeight: 600, color: MUTED, opacity: counters }}>
            {LOG_ROWS.length} פניות · {LOG_ROWS.length} נענו · {booked} תורים
          </span>
        </div>
        {LOG_ROWS.map((r, i) => {
          const at = CRM.rows + i * CRM.rowGap
          const p = spring({ frame: f - at, fps: 30, config: { damping: 17, stiffness: 240, mass: 0.6 } })
          const Icon = CHANNEL_ICON[r.channel]
          return (
            <div key={r.time} style={{ display: "grid", gridTemplateColumns: "110px 56px 1fr auto", alignItems: "center", gap: 16, height: 116, padding: "0 28px", borderTop: i ? `2px solid ${HAIRLINE}` : "none", opacity: f < at ? 0 : clamp01(p * 1.5), transform: `translateX(${(1 - Math.min(1, p)) * 120}px)` }}>
              <span dir={r.time === "חג" ? "rtl" : "ltr"} style={{ fontSize: 34, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                {r.time}
              </span>
              <span style={{ width: 50, height: 50, borderRadius: 999, background: CHANNEL[r.channel].color, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} strokeWidth={2.4} />
              </span>
              <span style={{ fontSize: 30, color: INK }}>{r.what}</span>
              <span style={{ padding: "8px 18px", borderRadius: 999, fontSize: 26, fontWeight: 700, background: r.booked ? INK : WHITE, color: r.booked ? WHITE : MUTED, border: r.booked ? "none" : `2px solid ${HAIRLINE}`, whiteSpace: "nowrap" }}>
                {r.done}
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function Crm({ f }: { f: number }) {
  // The hung-up call, while the phone-blue curtain crosses it.
  const x = (WIDTH + CURTAIN_EDGE) * (1 - CURTAIN_EASE(clamp01((f - CRM.in) / CRM.sweep)))
  const board = <Board f={f} />
  const scene = f < CRM.log - 4 ? board : <Whip f={f} at={CRM.log - 4} dur={8} id="to-log" from={board} to={<NightLog f={f} />} />
  if (f >= CRM.in + CRM.sweep) return scene
  return (
    <AbsoluteFill>
      <Call f={f} />
      <LiquidCurtain x={x} frame={f} color={BLUE}>
        {scene}
      </LiquidCurtain>
    </AbsoluteFill>
  )
}

// ── 5 · the tagline and the end card ───────────────────────────────────────

function Tagline({ f }: { f: number }) {
  const style = { textAlign: "center", fontSize: 124, fontWeight: 800, color: ON_DARK, letterSpacing: "-0.035em", lineHeight: 1.05 } as const
  return (
    <AbsoluteFill style={{ background: NIGHT, justifyContent: "center", paddingBottom: 320, transform: shake(f, [TAGLINE + SLAM_LAND, TAGLINE + 20 + SLAM_LAND], 10, 10) }}>
      <Slam f={f} at={TAGLINE} style={style}>
        מזכירה שלא
      </Slam>
      <Slam f={f} at={TAGLINE + 20} style={{ ...style, color: BLUE_LIGHT }}>
        הולכת הביתה.
      </Slam>
    </AbsoluteFill>
  )
}

/** Scenes take the ad's own frame, so every timing constant above is absolute. */
export function Receptionist({ safeZones }: { safeZones: boolean; voice?: Voice }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT_STACK, background: NIGHT }}>
      {f < CALL_AT && <Office f={f} />}
      {f >= CALL_AT && f < CRM.in && <Call f={f} />}
      {f >= CRM.in && f < TAGLINE && <Crm f={f} />}
      {f >= TAGLINE && f < END && <Tagline f={f} />}
      {f >= END && <EndCard f={f - END} entry="brand" />}
      <Flash f={f} hits={[CALL_AT, TAGLINE, END]} dur={8} max={0.85} />
      <Grain id="receptionist-grain" opacity={0.07} />
      <Track cues={cues} />
      {safeZones && <SafeZones />}
    </AbsoluteFill>
  )
}
