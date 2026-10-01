import { ArrowUpLeft, Clock, Moon, Zap } from "lucide-react"
import Link from "next/link"

import { Avatar } from "@/components/crm/ui/avatar"
import { CHANNELS } from "@/components/crm/ui/channel"
import { Ltr } from "@/components/crm/ui/ltr"
import { SectionCard } from "@/components/crm/ui/section-card"
import { formatMoney, formatRelative } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"
import type { Channel, CrmData } from "@/lib/crm/types"

/** What the agents did while the owner was busy — the "why am I paying" card. */
export function AgentWorkCard({ data, metrics }: { data: CrmData; metrics: Metrics }) {
  const counts = new Map<Channel, number>()
  for (const c of data.contacts) counts.set(c.channel, (counts.get(c.channel) ?? 0) + 1)
  const total = data.contacts.length || 1

  const stats = [
    { icon: Zap, value: `${metrics.avgReplySeconds} שנ׳`, label: "זמן מענה ממוצע" },
    { icon: Moon, value: String(metrics.afterHours), label: "פניות מחוץ לשעות הפעילות" },
    { icon: Clock, value: `${metrics.hoursSaved} שע׳`, label: "עבודה שנחסכה (הערכה)" },
  ]

  return (
    <SectionCard title="מה הסוכנים עשו">
      <ul className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, value, label }) => (
          <li key={label} className="rounded-2xl bg-black/[0.045] p-3">
            <Icon className="size-4 text-crm-muted" aria-hidden />
            <p className="mt-2 text-[19px] font-medium leading-none tabular-nums">{value}</p>
            <p className="mt-1.5 text-[10.5px] leading-snug text-crm-muted">{label}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <p className="mb-2 text-[11px] text-crm-muted">פניות לפי ערוץ</p>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-black/[0.06]" role="img" aria-label="התפלגות הפניות לפי ערוץ">
          {[...counts.entries()].map(([channel, n]) => (
            <span key={channel} style={{ width: `${(n / total) * 100}%`, backgroundColor: CHANNELS[channel].color }} />
          ))}
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {[...counts.entries()].map(([channel, n]) => (
            <li key={channel} className="flex items-center gap-1.5 text-[11px]">
              <span className="size-2 rounded-full" style={{ backgroundColor: CHANNELS[channel].color }} />
              {CHANNELS[channel].label}
              <span className="text-crm-muted tabular-nums">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  )
}

/** Closed revenue against the subscription — the number that keeps a client. */
export function RoiCard({ data, metrics }: { data: CrmData; metrics: Metrics }) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-crm-accent p-5 text-white shadow-[0_24px_48px_-28px_rgba(24,32,64,0.5)] md:rounded-[34px]">
      <span aria-hidden className="absolute -start-10 -top-12 size-48 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-16 end-6 size-40 rounded-full bg-black/10" />
      <div className="relative">
        <p className="text-[15px] font-medium">החזר על ההשקעה</p>
        <p className="mt-5 text-[64px] font-semibold leading-none tracking-tight tabular-nums"><Ltr>×{metrics.roi}</Ltr></p>
      </div>
      <p className="relative mt-5 text-[13px] leading-relaxed text-white/80">
        ב־30 הימים האחרונים נסגרו {formatMoney(metrics.closed30)} ב-{metrics.closedCount30} עסקאות, מול מנוי של {formatMoney(data.tenant.planMonthly)} בחודש.
        <span className="mt-2 block text-[11px] text-white/60">לפי עסקאות שסומנו כשולמות</span>
      </p>
    </div>
  )
}

/** Who is waiting on a human — the short list worth opening the app for. */
export function NeedsYouCard({ data, metrics, base }: { data: CrmData; metrics: Metrics; base: string }) {
  const waiting = data.contacts
    .filter((c) => c.stageId !== data.pack.stages[data.pack.stages.length - 1].id && (c.handledBy === "human" || c.unread > 0))
    .slice(0, 4)

  return (
    <SectionCard
      title={`דורש אתכם${metrics.needsHuman ? ` · ${metrics.needsHuman}` : ""}`}
      actions={
        <Link href={`${base}/inbox`} className="text-xs font-medium text-crm-ink/70 underline-offset-4 hover:underline">
          לכל השיחות
        </Link>
      }
    >
      {waiting.length === 0 ? (
        <p className="rounded-2xl bg-black/[0.045] px-4 py-6 text-center text-sm text-crm-muted">הכול מטופל. הסוכנים מחזיקים את החזית.</p>
      ) : (
        <ul className="space-y-1.5">
          {waiting.map((c) => (
            <li key={c.id}>
              <Link href={`${base}/inbox?c=${c.id}`} className="group flex items-center gap-3 rounded-2xl bg-black/[0.045] px-3 py-2.5 transition-colors hover:bg-black/[0.08]">
                <Avatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{c.name}</span>
                  <span className="block truncate text-[11px] text-crm-muted">{c.summary}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-crm-muted">{formatRelative(c.lastContactAt, data.now)}</span>
                  {c.unread ? <span className="grid min-w-4 place-items-center rounded-full bg-crm-accent px-1 text-[10px] leading-4 text-white">{c.unread}</span> : <ArrowUpLeft className="size-3.5 text-crm-muted transition-transform group-hover:-translate-y-0.5" aria-hidden />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
