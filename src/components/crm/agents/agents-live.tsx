import { Info } from "lucide-react"

import { CHANNELS } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import type { Channel, CrmData } from "@/lib/crm/types"

const AGENT_NAME: Record<Channel, string> = { whatsapp: "סוכן וואטסאפ", instagram: "סוכן אינסטגרם", voice: "סוכן טלפוני" }

/** The real workspace's agents screen. No dials that don't do anything yet:
 *  each agent the business bought, whether conversations from its channel have
 *  started to arrive, and what it has done so far. */
export function AgentsLive({ data }: { data: CrmData }) {
  const { pack, tenant, contacts, appointments } = data

  return (
    <div>
      <PageHeader title="הסוכנים" eyebrow="מה כל סוכן עשה עד היום" />

      <Glass className="mb-3 flex items-start gap-3 p-4 md:mb-4 md:items-center md:p-5">
        <Info className="mt-0.5 size-5 shrink-0 md:mt-0" aria-hidden />
        <p className="text-[13px] leading-relaxed text-crm-ink/80">
          הסוכנים מתחברים אליכם בהקמה אישית: חשבון הערוץ, הקטלוג, שעות הפעילות והטון. כשערוץ מתחיל להעביר שיחות, הסטטוס כאן עובר ל״פעיל״ והמספרים מתעדכנים לבד. לשינוי הגדרות כתבו לנו ונטפל.
        </p>
      </Glass>

      {tenant.agents.length === 0 ? (
        <Glass className="p-6 text-center text-[14px] text-crm-ink/70">עוד לא הוגדרו סוכנים לעסק הזה.</Glass>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {tenant.agents.map((channel) => {
            const mine = contacts.filter((c) => c.channel === channel)
            const booked = appointments.filter((a) => mine.some((c) => c.id === a.contactId)).length
            const replies = mine.map((c) => c.firstReplySeconds).filter((s) => s > 0)
            const avg = replies.length ? Math.round(replies.reduce((s, v) => s + v, 0) / replies.length) : null
            const { icon: Icon, color } = CHANNELS[channel]
            const live = mine.length > 0
            return (
              <li key={channel}>
                <Glass className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: color }}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-medium">{AGENT_NAME[channel]}</h2>
                      <p className="text-xs text-crm-muted">{CHANNELS[channel].label}</p>
                    </div>
                    <Pill tone={live ? "ink" : "soft"}>{live ? "פעיל" : "ממתין לחיבור"}</Pill>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "שיחות", value: String(mine.length) },
                      { label: "זמן מענה", value: avg === null ? "—" : `${avg} שנ׳` },
                      { label: "לידים חמים", value: String(mine.filter((c) => c.temperature === "hot").length) },
                      { label: pack.vocab.bookings, value: String(booked) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl bg-black/[0.045] px-3.5 py-3">
                        <dt className="text-[11px] text-crm-muted">{s.label}</dt>
                        <dd className="mt-0.5 text-[20px] font-medium tabular-nums">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Glass>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
