import { AbsoluteFill, useCurrentFrame } from "remotion"
import { ChatPhone, type Beat } from "../components/ChatPhone"
import { KineticText } from "../components/KineticText"
import { LockScreenStory, NIGHT_HOLD } from "../components/LockScreenStory"
import { Typewriter } from "../components/Typewriter"
import { CHANNEL, EASE_OUT, NIGHT, ON_DARK, clamp01, ease, type Channel } from "../theme"

/** Beat 4 (270 frames). The night's lock screen gives way to three
 *  businesses' phones in a carousel that runs right to left, each answering
 *  in its own channel. The caption's channel word types itself in sync with
 *  whichever phone is in focus. */

interface Business {
  channel: Channel
  title: string
  status: string
  call?: boolean
  /** Scene frame this phone takes focus and its conversation starts. */
  start: number
  beats: Beat[]
}

const BUSINESSES: Business[] = [
  {
    channel: "whatsapp",
    title: "תיווך נדל״ן",
    status: "מקוון · מגיב תוך שניות",
    start: 12,
    beats: [
      { at: 6, kind: "customer", text: "הדירה בהרצל עוד פנויה?" },
      { at: 18, kind: "typing", until: 32 },
      { at: 32, kind: "agent", text: "כן! צפייה מחר ב-18:00?" },
      { at: 50, kind: "customer", text: "סגור 👍" },
      { at: 62, kind: "chip", text: "צפייה נקבעה · מחר 18:00" },
    ],
  },
  {
    channel: "instagram",
    title: "שף פרטי",
    status: "הודעה פרטית",
    start: 100,
    beats: [
      { at: 6, kind: "customer", text: "שף לשישי, 12 איש?" },
      { at: 18, kind: "typing", until: 32 },
      { at: 32, kind: "agent", text: "שישי פנוי 🙂 שולח תפריטים" },
      { at: 50, kind: "chip", text: "תפריטים נשלחו · ליד חם" },
    ],
  },
  {
    channel: "phone",
    title: "מרפאת שיניים",
    status: "שיחה נכנסת",
    call: true,
    start: 188,
    beats: [
      { at: 8, kind: "customer", text: "אפשר תור לבדיקה?" },
      { at: 28, kind: "agent", text: "מחר ב-10:30 או ב-16:00?" },
      { at: 46, kind: "customer", text: "10:30" },
      { at: 58, kind: "chip", text: "תור נקבע ביומן · מחר 10:30" },
    ],
  },
]

const PHONE_W = 640
const SPACING = 640
const PHONE_TOP = 590
const SWITCH = 14 // frames for the carousel to move one phone over

function focusAt(f: number) {
  // Settles on each business as its conversation starts.
  return BUSINESSES.reduce((acc, b, i) => (i === 0 ? 0 : acc + EASE_OUT(clamp01((f - (b.start - SWITCH)) / SWITCH))), 0)
}

function callStatus(lf: number) {
  const s = Math.max(0, Math.floor(lf / 30))
  return `שיחה נכנסת · 00:${String(s).padStart(2, "0")}`
}

export function Agents() {
  const f = useCurrentFrame()
  const focus = focusAt(f)
  const lockOut = ease(f, 0, 14)
  const phonesIn = ease(f, 2, 20)

  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      {/* the lock screen, handing over */}
      <AbsoluteFill style={{ opacity: 1 - lockOut, transform: `scale(${1 - 0.06 * lockOut})` }}>
        <LockScreenStory f={NIGHT_HOLD} headlines={false} />
      </AbsoluteFill>

      <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
        <KineticText lines={["עונה תוך שניות"]} f={f} inAt={4} size={92} color={ON_DARK} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 92,
            fontWeight: 800,
            color: ON_DARK,
            letterSpacing: "-0.035em",
            lineHeight: 1.06,
            opacity: ease(f, 10, 12),
          }}
        >
          <span>ב</span>
          <Typewriter
            f={f}
            cursorColor={ON_DARK}
            words={BUSINESSES.map((b, i) => ({
              word: CHANNEL[b.channel].label,
              color: CHANNEL[b.channel].color,
              from: b.start,
              to: i < BUSINESSES.length - 1 ? BUSINESSES[i + 1].start - SWITCH - 6 : undefined,
            }))}
          />
        </div>
      </div>

      {BUSINESSES.map((b, i) => {
        const offset = i - focus // + is to the right: the queue enters from the right
        const d = Math.min(1, Math.abs(offset))
        const x = 540 + offset * SPACING + (1 - phonesIn) * 420
        const lf = f - b.start
        return (
          <div
            key={b.title}
            style={{
              position: "absolute",
              top: PHONE_TOP,
              left: x - PHONE_W / 2,
              width: PHONE_W,
              opacity: phonesIn * (1 - 0.55 * d),
              transform: `scale(${1 - 0.2 * d})`,
              transformOrigin: "50% 0%",
              filter: d > 0.02 ? `blur(${(3.5 * d).toFixed(2)}px)` : undefined,
            }}
          >
            <ChatPhone
              width={PHONE_W}
              channel={b.channel}
              title={b.title}
              status={b.call ? callStatus(lf) : b.status}
              beats={b.beats}
              lf={lf}
              call={b.call}
            />
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
