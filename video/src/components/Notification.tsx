import { CHANNEL, type Channel } from "../theme"
import { CHANNEL_ICON } from "./icons"

export interface NotificationData {
  channel: Channel
  sender: string
  text: string
  time: string
}

/** A lock-screen notification in the brand's own styling rather than a copy
 *  of iOS or Android chrome — an illustration of a phone, not a fake system
 *  alert on the viewer's screen, which Meta's ad policy on non-existent
 *  functionality can reject.
 *  `faded` 0→1 drains it to the grey, too-late look of the morning. */
export function NotificationCard({
  n,
  width,
  faded = 0,
  tag,
}: {
  n: NotificationData
  width: number
  faded?: number
  tag?: { text: string; opacity: number }
}) {
  const Icon = CHANNEL_ICON[n.channel]
  const pct = Math.round((1 - faded) * 100)
  const iconBg = `color-mix(in srgb, ${CHANNEL[n.channel].color} ${pct}%, #4a4a4a)`
  const textAlpha = 0.94 - faded * 0.42
  return (
    <div
      style={{
        width,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        padding: "22px 24px",
        borderRadius: 34,
        background: `rgba(255, 255, 255, ${0.11 - faded * 0.05})`,
        border: "1px solid rgba(255, 255, 255, 0.07)",
        backdropFilter: "blur(24px) saturate(140%)",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 62,
          height: 62,
          borderRadius: 999,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <Icon size={32} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 29, fontWeight: 700, color: `rgba(255, 255, 255, ${textAlpha})` }}>{n.sender}</span>
          <span style={{ position: "relative", fontSize: 22, fontWeight: 400, color: "rgba(255, 255, 255, 0.5)", whiteSpace: "nowrap" }}>
            <span style={{ opacity: 1 - (tag?.opacity ?? 0) }}>
              {CHANNEL[n.channel].label} · {n.time}
            </span>
            {tag && tag.opacity > 0 && (
              <span style={{ position: "absolute", insetInlineEnd: 0, top: 0, opacity: tag.opacity }}>{tag.text}</span>
            )}
          </span>
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 31,
            fontWeight: 400,
            lineHeight: 1.3,
            color: `rgba(255, 255, 255, ${textAlpha})`,
          }}
        >
          {n.text}
        </div>
      </div>
    </div>
  )
}
