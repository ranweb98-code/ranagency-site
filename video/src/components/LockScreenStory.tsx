import { AbsoluteFill, Easing, interpolateColors, spring } from "remotion"
import { FPS, MORNING, NIGHT, ON_DARK, clamp01, ease } from "../theme"
import { Clock } from "./Clock"
import { Device } from "./Device"
import { KineticText } from "./KineticText"
import { NotificationCard, type NotificationData } from "./Notification"

/** Beats 1 and 2 of the storyboard as one continuous story, driven by `f`
 *  (0–210) rather than by the current frame, so the rewind can play it
 *  backwards and the agents scene can hold its night state. */

type Timed = NotificationData & { at: number }

// Arrival order: the newest lands on top, so "כמה עולה?" — the one every
// business gets — arrives last and stays in the safe band.
const NIGHT_MESSAGES: Timed[] = [
  { at: 8, channel: "whatsapp", sender: "מיכל", text: "אפשר לקבוע לשבוע הבא?", time: "עכשיו" },
  { at: 20, channel: "phone", sender: "רונית", text: "שיחה שלא נענתה (2)", time: "עכשיו" },
  { at: 30, channel: "instagram", sender: "נועה", text: "יש זמינות מחר?", time: "עכשיו" },
  { at: 38, channel: "whatsapp", sender: "דנה", text: "כמה עולה?", time: "עכשיו" },
]
const MORNING_REPLIES: Timed[] = [
  { at: 152, channel: "whatsapp", sender: "דנה", text: "תודה, כבר סגרתי עם מישהו אחר", time: "08:43" },
  { at: 166, channel: "instagram", sender: "נועה", text: "כבר לא רלוונטי", time: "08:47" },
  { at: 180, channel: "whatsapp", sender: "מיכל", text: "מצאתי מקום אחר, תודה", time: "08:52" },
]
const ALL = [...NIGHT_MESSAGES, ...MORNING_REPLIES]

export const NIGHT_HOLD = 60 // f at which the night is fully set: four messages, no reply yet

const T_NIGHT = 23 * 60 + 41 // 23:41
const T_MORNING = 24 * 60 + 8 * 60 + 40 // 08:40 the next day
const ROLL_START = 98
const ROLL_END = 146
const rollEase = Easing.inOut(Easing.cubic)

export function clockAt(f: number) {
  return T_NIGHT + (T_MORNING - T_NIGHT) * rollEase(clamp01((f - ROLL_START) / (ROLL_END - ROLL_START)))
}

const DEVICE_W = 660
const DEVICE_LEFT = (1080 - DEVICE_W) / 2
const DEVICE_TOP = 580
const CARD_W = 580
const STACK_TOP = 392 // inside the screen
const PITCH = 140

function arrived(f: number, at: number) {
  return spring({ frame: Math.round(f - at), fps: FPS, config: { damping: 17, stiffness: 190, mass: 0.8 } })
}

export function LockScreenStory({ f, headlines = true }: { f: number; headlines?: boolean }) {
  const mood = ease(f, 100, 46) // 0 night → 1 grey morning
  const t = clockAt(f)
  const speed = t - clockAt(f - 1)
  const pushIn = 1 + 0.03 * clamp01(f / 210)

  return (
    <AbsoluteFill style={{ background: interpolateColors(mood, [0, 1], [NIGHT, MORNING]) }}>
      {/* the screen's light spilling onto the dark around it */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(62% 40% at 50% 60%, rgba(255, 255, 255, ${0.13 * (1 - mood)}), transparent 72%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 50% 45%, transparent 55%, rgba(0, 0, 0, 0.5) 100%)" }} />

      {headlines && (
        <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
          <div style={{ position: "absolute", left: 0, right: 0 }}>
            <KineticText lines={["הלקוחות לא מחכים", "לבוקר."]} f={f} inAt={36} outAt={92} size={96} color={ON_DARK} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0 }}>
            <KineticText lines={["בבוקר הם כבר", "אצל מישהו אחר."]} f={f} inAt={150} size={96} color={ON_DARK} />
          </div>
        </div>
      )}

      <Device
        width={DEVICE_W}
        variant="dark"
        style={{ left: DEVICE_LEFT, top: DEVICE_TOP, transform: `scale(${pushIn})`, transformOrigin: "50% 20%" }}
      >
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 70% at 50% 0%, ${interpolateColors(mood, [0, 1], ["#1d1d1d", "#4d4d4d"])} 0%, ${interpolateColors(mood, [0, 1], ["#0c0c0c", "#2f2f2f"])} 66%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 104,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.72)",
          }}
        >
          {t >= 24 * 60 ? "יום רביעי" : "יום שלישי"}
        </div>
        <div style={{ position: "absolute", top: 138, left: 0, right: 0 }}>
          <Clock t={t} speed={speed} size={204} color={ON_DARK} />
        </div>

        {ALL.map((n) => {
          if (f < n.at) return null
          const enter = arrived(f, n.at)
          // Every later arrival pushes this card one slot down.
          const slot = ALL.filter((m) => m.at > n.at && f >= m.at).reduce((sum, m) => sum + arrived(f, m.at), 0)
          const isReply = n.at >= MORNING_REPLIES[0].at
          const faded = isReply ? 0.85 : ease(f, 150, 20)
          const tag = isReply ? undefined : { text: "✓✓ ענית ב-08:41", opacity: ease(f, 146 + NIGHT_MESSAGES.indexOf(n) * 3, 8) }
          return (
            <div
              key={`${n.sender}-${n.at}`}
              style={{
                position: "absolute",
                top: STACK_TOP + slot * PITCH,
                left: "50%",
                opacity: enter,
                transform: `translateX(-50%) translateY(${(1 - enter) * -36}px) scale(${0.95 + 0.05 * enter})`,
              }}
            >
              <NotificationCard n={n} width={CARD_W} faded={faded} tag={tag} />
            </div>
          )
        })}
      </Device>
    </AbsoluteFill>
  )
}
