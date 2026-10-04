import { ArrowUpLeft, Check } from "lucide-react"
import Link from "next/link"

import { DetailsCard, ProfileCard } from "@/components/crm/overview/profile-panel"
import { ItemCard } from "@/components/crm/ui/item-card"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Timeline } from "@/components/crm/ui/timeline"
import { formatMoney, formatTime } from "@/lib/crm/format"
import type { Contact, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

/** One person's full card — shared by the demo and the real workspace. */
export function ContactDetail({ data, contact }: { data: CrmData; contact: Contact }) {
  const { pack } = data
  const base = data.basePath
  const item = data.catalog.find((c) => c.id === contact.itemId)
  const stageIndex = pack.stages.findIndex((s) => s.id === contact.stageId)
  const stage = pack.stages[stageIndex]
  const recent = [...contact.messages].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-4)

  return (
    <div>
      <PageHeader title={contact.name} eyebrow={`${pack.vocab.person} · ${stage.label}`} backHref={`${base}/contacts`} />

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:col-span-4 lg:content-start">
          <ProfileCard contact={contact} data={data} base={base} />
          <DetailsCard contact={contact} data={data} base={base} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:col-span-8 lg:grid-cols-2 lg:content-start">
          <SectionCard title="התקדמות" className="lg:col-span-2" actions={<Pill tone="warm">הסתברות סגירה {Math.round(stage.probability * 100)}%</Pill>}>
            <ol className="flex flex-wrap gap-1.5">
              {pack.stages.map((s, i) => {
                const done = i < stageIndex
                const current = i === stageIndex
                return (
                  <li
                    key={s.id}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium",
                      current ? "bg-crm-accent text-white" : done ? "bg-crm-ink text-white" : "bg-black/[0.06] text-crm-muted",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : null}
                    {s.label}
                  </li>
                )
              })}
            </ol>
            <p className="mt-4 text-[13px] text-crm-ink/70">
              שווי העסקה <span className="font-semibold text-crm-ink tabular-nums">{formatMoney(contact.value)}</span>
              {contact.closedAt ? " · שולם" : " · הערכה, עד שהעסקה נסגרת"}
            </p>
          </SectionCard>

          {item ? (
            <SectionCard title={`${pack.vocab.catalogItem} שמעניין`}>
              <ItemCard item={item} icon={pack.catalogIcon} />
            </SectionCard>
          ) : null}

          <SectionCard
            title="שיחה אחרונה"
            actions={
              <Link href={`${base}/inbox?c=${contact.id}`} className="flex items-center gap-1 text-xs font-medium text-crm-ink/70 underline-offset-4 hover:underline">
                לשיחה המלאה <ArrowUpLeft className="size-3.5" aria-hidden />
              </Link>
            }
          >
            {recent.length === 0 ? <p className="text-[13px] text-crm-muted">עוד אין הודעות בשיחה הזו.</p> : null}
            <ul className="space-y-2">
              {recent.map((m) => (
                <li key={m.id} className={cn("max-w-[92%] rounded-[18px] px-3.5 py-2 text-[12.5px] leading-relaxed", m.from === "customer" ? "bg-white/85 ms-auto" : m.from === "agent" ? "bg-crm-accent text-white" : "bg-crm-ink text-white")}>
                  {m.text}
                  <span className="mt-0.5 block text-[10px] opacity-90">{formatTime(m.at)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <Glass className={cn("p-4 md:p-5", item ? "lg:col-span-2" : "lg:col-span-2")}>
            <h2 className="mb-4 text-[15px] font-medium">ציר זמן</h2>
            <Timeline events={contact.timeline} now={data.now} />
          </Glass>
        </div>
      </div>
    </div>
  )
}
