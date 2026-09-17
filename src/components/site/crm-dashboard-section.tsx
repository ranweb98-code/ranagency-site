import { CalendarCheck, CalendarClock, Camera, MessageCircle, Phone, type LucideIcon } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { TiltCard } from "@/components/ui/tilt-card"
import { cn } from "@/lib/utils"

type Channel = "whatsapp" | "instagram" | "voice"
type Status = "hot" | "cold"

interface Lead {
  name: string
  phone: string
  channel: Channel
  status: Status
  summary: string
  appointment: string
  appointmentSet: boolean
}

const CHANNEL_META: Record<Channel, { icon: LucideIcon; label: string }> = {
  whatsapp: { icon: MessageCircle, label: "וואטסאפ" },
  instagram: { icon: Camera, label: "אינסטגרם" },
  voice: { icon: Phone, label: "טלפון" },
}

const LEADS: Lead[] = [
  {
    name: "מאיה כהן",
    phone: "054-123-4567",
    channel: "whatsapp",
    status: "hot",
    summary: "מתעניינת בטיפול פנים, ביקשה מחיר וזמינות השבוע",
    appointment: "נקבע · ג׳ 14:00",
    appointmentSet: true,
  },
  {
    name: "עידן לוי",
    phone: "052-987-6543",
    channel: "instagram",
    status: "hot",
    summary: "שאל על זמינות לאירוע ב־20 לחודש, מחכה לאישור סופי",
    appointment: "ממתין לאישור",
    appointmentSet: false,
  },
  {
    name: "אלון שרון",
    phone: "053-444-5556",
    channel: "voice",
    status: "hot",
    summary: "התקשר וביקש תור דחוף להיום — הסוכן הקולי קבע לו מיד",
    appointment: "נקבע · היום 18:30",
    appointmentSet: true,
  },
  {
    name: "נועה ברק",
    phone: "050-111-2223",
    channel: "voice",
    status: "cold",
    summary: "שאלה כללית על מחירים, לא השאירה פרטים נוספים",
    appointment: "טרם נקבע",
    appointmentSet: false,
  },
  {
    name: "שירה גל",
    phone: "058-777-8889",
    channel: "instagram",
    status: "cold",
    summary: "שאלה על משלוחים לאזור המרכז",
    appointment: "טרם נקבע",
    appointmentSet: false,
  },
]

export function CrmDashboardSection() {
  return (
    <section id="dashboard" className="relative overflow-hidden bg-ran-surface-subtle py-24 text-ran-text-on-light">
      <SectionContainer className="relative">
        <Reveal className="mx-auto mb-14 max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">תראו את זה בפעולה</p>
          <h2
            className="font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.025em" }}
          >
            כל ליד, מכל ערוץ, במקום אחד
          </h2>
          <p className="text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6 }}>
            כל שיחה מוואטסאפ, אינסטגרם וטלפון נכנסת אוטומטית לדשבורד אחד — עם סטטוס חם או קר, סיכום
            שיחה ומצב תור, בלי שתצטרכו לעבור בין אפליקציות.
          </p>
        </Reveal>

        <Reveal className="mx-auto max-w-5xl">
          <TiltCard className="rounded-3xl">
            <div
              className="overflow-hidden rounded-3xl border border-ran-glass-border-light shadow-[0_24px_60px_-24px_rgba(17,17,17,0.28)]"
              style={{
                // Same "more presence" gradient treatment as the flow
                // diagrams and the closing CTA card, tinted with this
                // section's one established accent — the live-status green —
                // rather than a flat white window.
                background: "radial-gradient(130% 130% at 15% 85%, color-mix(in srgb, #10b981 24%, var(--surface-raised)) 0%, var(--surface-raised) 65%)",
              }}
            >
              {/* window chrome — neutral dots rather than the usual traffic
                  lights, which would be the only colour left on the page */}
              <div className="flex items-center gap-2 border-b border-ran-glass-border-light bg-ran-surface-subtle px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ran-text-on-light/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-ran-text-on-light/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-ran-text-on-light/15" />
                <span className="mr-2 text-xs font-semibold text-ran-text-on-light-muted">
                  נפוץ&apos; · CRM
                </span>
                <span className="mr-auto flex items-center gap-1.5 text-xs font-medium text-ran-text-on-light-muted">
                  {/* The one deliberate colour exception on this section: a
                      "live" status light reads universally as green, the same
                      way it would on a real device — this isn't a return of
                      the old brand accent, it's a status signal. */}
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  מחובר בזמן אמת
                </span>
              </div>

              {/* A continuously moving dashed line — the same "packets
                  flowing" language as the connector lines in the agent flow
                  diagrams above, made bolder there and now echoed here so the
                  motion reads as one deliberate visual system rather than a
                  one-off on the agents section. Reinforces "live data
                  streaming into one CRM" without needing new copy. */}
              <div
                aria-hidden
                className="crm-flow-line h-[4px] w-full"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, var(--text-strong) 0px, var(--text-strong) 16px, transparent 16px, transparent 32px)",
                  opacity: 0.9,
                }}
              />

              {/* table — desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-right" style={{ fontSize: "var(--text-body)" }}>
                  <thead>
                    <tr className="border-b border-ran-glass-border-light text-xs font-semibold text-ran-text-on-light-muted">
                      <th className="px-5 py-3 font-semibold">ליד</th>
                      <th className="px-5 py-3 font-semibold">ערוץ</th>
                      <th className="px-5 py-3 font-semibold">סטטוס</th>
                      <th className="px-5 py-3 font-semibold">סיכום שיחה</th>
                      <th className="px-5 py-3 font-semibold">תור</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEADS.map((lead) => (
                      <LeadRow key={lead.phone} lead={lead} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* cards — mobile */}
              <RevealGroup className="flex flex-col gap-3 p-4 md:hidden">
                {LEADS.map((lead) => (
                  <RevealItem key={lead.phone}>
                    <LeadCard lead={lead} />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </TiltCard>
        </Reveal>
      </SectionContainer>
    </section>
  )
}

// Hot vs cold used to be an orange/blue pill pair. Hot is now solid green —
// the same "live/good signal" green as the connection dot above, rather than
// the section's own ink — cold stays a neutral hairline outline. emerald-700
// specifically: emerald-500/600 read as green fine but fall short of 4.5:1
// white-text contrast at this badge's small text-xs size; 700 clears it.
function StatusBadge({ status }: { status: Status }) {
  const hot = status === "hot"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        hot
          ? "bg-emerald-700 text-white"
          : "border border-ran-glass-border-light text-ran-text-on-light-muted"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", hot ? "bg-white" : "bg-ran-text-on-light/40")} />
      {hot ? "חם" : "קר"}
    </span>
  )
}

function ChannelBadge({ channel }: { channel: Channel }) {
  const meta = CHANNEL_META[channel]
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-ran-text-on-light">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light">
        <Icon className="h-3 w-3" />
      </span>
      <span className="text-xs font-medium text-ran-text-on-light-muted">{meta.label}</span>
    </span>
  )
}

function AppointmentCell({ lead }: { lead: Lead }) {
  const Icon = lead.appointmentSet ? CalendarCheck : CalendarClock
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold",
        lead.appointmentSet ? "text-ran-text-on-light" : "text-ran-text-on-light-muted"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {lead.appointment}
    </span>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="border-b border-ran-glass-border-light last:border-0 hover:bg-ran-surface-light">
      <td className="px-5 py-3.5">
        <p className="font-bold text-ran-text-on-light">{lead.name}</p>
        <p className="text-xs text-ran-text-on-light-muted" dir="ltr">
          {lead.phone}
        </p>
      </td>
      <td className="px-5 py-3.5">
        <ChannelBadge channel={lead.channel} />
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={lead.status} />
      </td>
      <td className="max-w-[260px] px-5 py-3.5 text-ran-text-on-light-muted">{lead.summary}</td>
      <td className="px-5 py-3.5">
        <AppointmentCell lead={lead} />
      </td>
    </tr>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-2xl border border-ran-glass-border-light bg-ran-surface-light p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-ran-text-on-light">{lead.name}</p>
        <StatusBadge status={lead.status} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <ChannelBadge channel={lead.channel} />
        <span className="text-xs text-ran-text-on-light-muted" dir="ltr">
          {lead.phone}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ran-text-on-light-muted">{lead.summary}</p>
      <div className="mt-3">
        <AppointmentCell lead={lead} />
      </div>
    </div>
  )
}
