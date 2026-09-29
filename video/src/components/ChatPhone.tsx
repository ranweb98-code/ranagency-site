import { Check, Grid3x3, Mic, PhoneOff } from "lucide-react"
import { spring } from "remotion"
import { CHANNEL, FPS, HAIRLINE, INK, MUTED, SURFACE, WHITE, type Channel } from "../theme"
import { Device } from "./Device"
import { CHANNEL_ICON } from "./icons"

/** A business's phone, answering. The visual language is the site's
 *  (src/components/site/agents-section.tsx): the business in the header,
 *  the customer on the right in a white bubble, the agent on the left in the
 *  channel colour, and the outcome as a pill once the exchange lands. A call
 *  swaps bubbles for a transcript with a rule on the speaker's side. */

export type Beat =
  | { at: number; kind: "customer" | "agent"; text: string }
  | { at: number; kind: "typing"; until: number }
  | { at: number; kind: "chip"; text: string }

const pop = (lf: number, at: number) =>
  spring({ frame: Math.round(lf - at), fps: FPS, config: { damping: 18, stiffness: 210, mass: 0.7 } })

function Header({
  channel,
  title,
  status,
  lf,
  call,
}: {
  channel: Channel
  title: string
  status: string
  lf: number
  call: boolean
}) {
  const color = CHANNEL[channel].color
  const Icon = CHANNEL_ICON[channel]
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "86px 28px 22px",
        background: `color-mix(in srgb, ${color} 7%, ${WHITE})`,
        borderBottom: `2px solid color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 76,
          height: 76,
          borderRadius: 999,
          background: color,
          color: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={38} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: INK }}>{title}</div>
        <div style={{ fontSize: 24, color: MUTED, marginTop: 2 }}>{status}</div>
      </div>
      {call ? <Waveform lf={lf} color={color} /> : <LiveDot lf={lf} color={color} />}
    </div>
  )
}

function LiveDot({ lf, color }: { lf: number; color: string }) {
  const ring = (lf % 36) / 36
  return (
    <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          background: color,
          opacity: 0.55 * (1 - ring),
          transform: `scale(${1 + ring * 1.6})`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: color }} />
    </div>
  )
}

function Waveform({ lf, color }: { lf: number; color: string }) {
  const peaks = [0.5, 1, 0.7, 1, 0.6]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 44, flexShrink: 0 }}>
      {peaks.map((peak, i) => {
        const phase = Math.sin((lf / 24) * Math.PI * 2 + i * 0.9)
        const h = 44 * (0.3 + (peak - 0.3) * (0.5 + 0.5 * phase))
        return <div key={i} style={{ width: 7, height: h, borderRadius: 999, background: color }} />
      })}
    </div>
  )
}

function Bubble({ from, text, p, color }: { from: "customer" | "agent"; text: string; p: number; color: string }) {
  const agent = from === "agent"
  return (
    <div
      style={{
        alignSelf: agent ? "flex-end" : "flex-start",
        maxWidth: "84%",
        padding: "18px 26px",
        fontSize: 35,
        lineHeight: 1.4,
        borderRadius: 32,
        // The tail corner sits on the speaker's side.
        borderStartStartRadius: agent ? 32 : 12,
        borderStartEndRadius: agent ? 12 : 32,
        background: agent ? color : WHITE,
        color: agent ? WHITE : INK,
        border: agent ? "none" : `2px solid ${HAIRLINE}`,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${0.97 + 0.03 * p})`,
        transformOrigin: agent ? "left top" : "right top",
      }}
    >
      {text}
    </div>
  )
}

function CallLine({ from, text, p, color }: { from: "customer" | "agent"; text: string; p: number; color: string }) {
  const agent = from === "agent"
  return (
    <div
      style={{
        alignSelf: agent ? "flex-end" : "flex-start",
        maxWidth: "86%",
        padding: "16px 24px",
        fontSize: 34,
        lineHeight: 1.4,
        borderRadius: 18,
        background: WHITE,
        color: agent ? INK : MUTED,
        // The rule marks the speaker: the agent's side is the left edge.
        borderInlineEnd: agent ? `6px solid ${color}` : "none",
        borderInlineStart: agent ? "none" : `6px solid ${HAIRLINE}`,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
      }}
    >
      {text}
    </div>
  )
}

function Typing({ lf, p, color }: { lf: number; p: number; color: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        display: "flex",
        gap: 10,
        padding: "24px 28px",
        borderRadius: 32,
        borderStartStartRadius: 32,
        borderStartEndRadius: 12,
        background: `color-mix(in srgb, ${color} 88%, white)`,
        opacity: p,
      }}
    >
      {[0, 1, 2].map((i) => {
        const phase = Math.sin(((lf - i * 4) / 27) * Math.PI * 2)
        return (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: WHITE,
              opacity: 0.45 + 0.55 * (0.5 + 0.5 * phase),
              transform: `translateY(${-3 * Math.max(0, phase)}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

function Chip({ text, p, color }: { text: string; p: number; color: string }) {
  return (
    <div
      style={{
        alignSelf: "center",
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 28px 14px 30px",
        borderRadius: 999,
        background: WHITE,
        border: `3px solid color-mix(in srgb, ${color} 35%, transparent)`,
        boxShadow: `0 18px 40px -22px color-mix(in srgb, ${color} 70%, transparent)`,
        opacity: Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 14}px) scale(${0.9 + 0.1 * p})`,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: color,
          color: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={26} strokeWidth={3.5} />
      </div>
      <span style={{ fontSize: 30, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  )
}

function Composer({ call }: { call: boolean }) {
  if (call) {
    return (
      <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 44 }}>
        {[Mic, Grid3x3, PhoneOff].map((Icon, i) => (
          <div
            key={i}
            style={{
              width: 104,
              height: 104,
              borderRadius: 999,
              background: i === 2 ? INK : WHITE,
              color: i === 2 ? WHITE : INK,
              border: i === 2 ? "none" : `2px solid ${HAIRLINE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={42} strokeWidth={2} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      style={{
        position: "absolute",
        bottom: 44,
        left: 26,
        right: 26,
        height: 92,
        borderRadius: 999,
        background: WHITE,
        border: `2px solid ${HAIRLINE}`,
        display: "flex",
        alignItems: "center",
        padding: "0 34px",
        fontSize: 30,
        color: "#a3a3a3",
      }}
    >
      הודעה
    </div>
  )
}

export function ChatPhone({
  width,
  channel,
  title,
  status,
  beats,
  lf,
  call = false,
}: {
  width: number
  channel: Channel
  title: string
  status: string
  beats: Beat[]
  /** Frames since this phone's conversation began; negative = not yet. */
  lf: number
  call?: boolean
}) {
  const color = CHANNEL[channel].color
  return (
    <Device width={width} variant="light">
      <div style={{ position: "absolute", top: 26, insetInlineStart: 40, fontSize: 24, fontWeight: 700, color: INK }}>23:41</div>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header channel={channel} title={title} status={status} lf={lf} call={call} />
      <div
        style={{
          position: "relative",
          flex: 1,
          background: `radial-gradient(120% 90% at 80% 0%, color-mix(in srgb, ${color} 10%, ${SURFACE}) 0%, ${SURFACE} 70%)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 26px" }}>
          {beats.map((b, i) => {
            if (lf < b.at) return null
            const p = pop(lf, b.at)
            if (b.kind === "typing") {
              if (lf >= b.until) return null
              return <Typing key={i} lf={lf} p={p} color={color} />
            }
            if (b.kind === "chip") return <Chip key={i} text={b.text} p={p} color={color} />
            return call ? (
              <CallLine key={i} from={b.kind} text={b.text} p={p} color={color} />
            ) : (
              <Bubble key={i} from={b.kind} text={b.text} p={p} color={color} />
            )
          })}
        </div>
        <Composer call={call} />
      </div>
      </div>
    </Device>
  )
}
