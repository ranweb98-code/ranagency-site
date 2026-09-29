import { AbsoluteFill, Freeze, spring, useCurrentFrame } from "remotion"
import { CURTAIN_EDGE, LiquidCurtain } from "../components/LiquidCurtain"
import { KineticText } from "../components/KineticText"
import { CHANNEL_ICON } from "../components/icons"
import { CHANNEL, CURTAIN_EASE, FPS, HAIRLINE, INK, LIVE, MUTED, SURFACE, WHITE, WIDTH, clamp01, ease, type Channel } from "../theme"
import { Agents } from "./Agents"

/** Beat 5 (120 frames). Morning crosses the night the way the rewind did,
 *  but in white: a white liquid curtain sweeps right to left and the CRM
 *  dashboard rides in on it. Then the night's leads land in it one by one,
 *  sorted hot and cold — Dana's "כמה עולה?" from the opening among them. */

interface Lead {
  name: string
  channel: Channel
  hot: boolean
  slot: string
}

const LEADS: Lead[] = [
  { name: "רונית", channel: "phone", hot: true, slot: "מחר 10:30" },
  { name: "אבי", channel: "whatsapp", hot: true, slot: "צפייה מחר 18:00" },
  { name: "נועה", channel: "instagram", hot: true, slot: "תפריטים נשלחו" },
  { name: "דנה", channel: "whatsapp", hot: false, slot: "שאלה על מחיר" },
]

const SWEEP = 22 // the site's 0.75s
const ROW_START = 30
const ROW_GAP = 10
const OFF = WIDTH + CURTAIN_EDGE

const WINDOW = { left: 70, top: 590, width: 940 }
const COLS = "200px 250px 150px 1fr"

function Row({ lead, f, at }: { lead: Lead; f: number; at: number }) {
  const p = spring({ frame: Math.round(f - at), fps: FPS, config: { damping: 18, stiffness: 170, mass: 0.8 } })
  const badge = spring({ frame: Math.round(f - at - 8), fps: FPS, config: { damping: 12, stiffness: 260, mass: 0.6 } })
  const Icon = CHANNEL_ICON[lead.channel]
  const color = CHANNEL[lead.channel].color
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: COLS,
        alignItems: "center",
        height: 104,
        padding: "0 34px",
        borderTop: `2px solid ${HAIRLINE}`,
        opacity: p,
        // Leads arrive from the right, the way everything in the ad flows.
        transform: `translateX(${(1 - p) * 140}px)`,
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 700, color: INK }}>{lead.name}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: color,
            color: WHITE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} strokeWidth={2.3} />
        </span>
        <span style={{ fontSize: 28, color: MUTED }}>{CHANNEL[lead.channel].label}</span>
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            padding: "6px 22px",
            borderRadius: 999,
            fontSize: 26,
            fontWeight: 700,
            background: lead.hot ? INK : WHITE,
            color: lead.hot ? WHITE : MUTED,
            border: lead.hot ? "none" : `2px solid ${HAIRLINE}`,
            transform: `scale(${0.6 + 0.4 * badge})`,
            opacity: clamp01(badge * 1.5),
          }}
        >
          {lead.hot ? "חם" : "קר"}
        </span>
      </span>
      <span style={{ fontSize: 28, color: INK }}>{lead.slot}</span>
    </div>
  )
}

function Dashboard({ f }: { f: number }) {
  const pulse = (f % 30) / 30
  return (
    <div
      style={{
        position: "absolute",
        left: WINDOW.left,
        top: WINDOW.top,
        width: WINDOW.width,
        borderRadius: 38,
        overflow: "hidden",
        border: `2px solid ${HAIRLINE}`,
        boxShadow: "0 40px 90px -40px rgba(17, 17, 17, 0.35)",
        // The site's CRM window: one wash of the live-status green, bottom corner.
        background: `radial-gradient(130% 130% at 15% 85%, color-mix(in srgb, ${LIVE} 20%, ${WHITE}) 0%, ${WHITE} 65%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "22px 30px",
          background: SURFACE,
          borderBottom: `2px solid ${HAIRLINE}`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: 999, background: "rgba(17, 17, 17, 0.15)" }} />
        ))}
        <span style={{ marginInlineStart: 10, fontSize: 26, fontWeight: 700, color: MUTED }}>נפוץ' · CRM · 08:00</span>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: MUTED }}>
          <span style={{ position: "relative", width: 12, height: 12 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: LIVE,
                opacity: 0.5 * (1 - pulse),
                transform: `scale(${1 + pulse * 1.8})`,
              }}
            />
            <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: LIVE }} />
          </span>
          מחובר בזמן אמת
        </span>
      </div>
      {/* The site's "data is flowing" strip, running toward the reading end. */}
      <div
        style={{
          height: 6,
          backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0px, ${INK} 16px, transparent 16px, transparent 32px)`,
          backgroundPosition: `${-(f % 21) * (32 / 21)}px 0`,
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          padding: "18px 34px",
          fontSize: 24,
          fontWeight: 700,
          color: MUTED,
        }}
      >
        <span>ליד</span>
        <span>ערוץ</span>
        <span>סטטוס</span>
        <span>תור</span>
      </div>
      {LEADS.map((lead, i) => (
        <Row key={lead.name} lead={lead} f={f} at={ROW_START + i * ROW_GAP} />
      ))}
    </div>
  )
}

export function Morning() {
  const f = useCurrentFrame()
  const x = OFF * (1 - CURTAIN_EASE(clamp01(f / SWEEP)))
  return (
    <AbsoluteFill>
      {/* the night, held on its last frame while the morning crosses it */}
      {f < SWEEP && (
        <Freeze frame={269}>
          <Agents />
        </Freeze>
      )}
      <LiquidCurtain x={x} frame={f} color="white">
        <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
          <KineticText lines={["בבוקר הם כבר", "ביומן שלך."]} f={f} inAt={14} size={96} color={INK} />
        </div>
        <div style={{ opacity: ease(f, 6, 14) }}>
          <Dashboard f={f} />
        </div>
      </LiquidCurtain>
    </AbsoluteFill>
  )
}
