"use client"

import { BarChart3, CalendarCheck, UserPlus } from "lucide-react"
import { useMemo, useState } from "react"

import { PageHeader } from "@/components/crm/ui/page-header"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Ltr } from "@/components/crm/ui/ltr"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { formatMoneyCompact } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"
import type { CrmData } from "@/lib/crm/types"
import { CalendarCard } from "./calendar-card"
import { DealCards } from "./deal-cards"
import { FunnelCard } from "./funnel-card"
import { AgentWorkCard, NeedsYouCard, RoiCard } from "./insight-cards"
import { DetailsCard, ProfileCard } from "./profile-panel"
import { RevenueCard } from "./revenue-card"

export function OverviewView({ data, metrics }: { data: CrmData; metrics: Metrics }) {
  const base = data.basePath
  const { vocab } = data.pack

  const deals = useMemo(
    () =>
      // A "deal" is something past the first conversation — a lead that has
      // only said hello is a lead, not money on the table.
      [...data.contacts]
        .filter((c) => data.pack.stages.findIndex((s) => s.id === c.stageId) >= data.pack.bookedFromStage)
        .sort((a, b) => Date.parse(b.closedAt ?? b.lastContactAt) - Date.parse(a.closedAt ?? a.lastContactAt))
        .slice(0, 6),
    [data.contacts, data.pack.stages, data.pack.bookedFromStage],
  )

  const [selectedId, setSelectedId] = useState(metrics.hotOpen[0]?.id ?? data.contacts[0].id)
  const selected = data.contacts.find((c) => c.id === selectedId) ?? data.contacts[0]

  const delta = metrics.closedDelta

  return (
    <div>
      <PageHeader title="סקירה" eyebrow={`${data.tenant.businessName} · ${data.pack.label}`}>
        <StatTile
          href={`${base}/pipeline`}
          icon={BarChart3}
          value={formatMoneyCompact(metrics.closed30)}
          label={`${vocab.revenue}\n${metrics.closedCount30} עסקאות ב־30 יום`}
          badge={delta === null ? undefined : <><Ltr>{delta > 0 ? "+" : ""}{delta}%</Ltr> חודש</>}
        />
        <StatTile href={`${base}/contacts`} icon={UserPlus} value={<Ltr>+{metrics.newLeads7}</Ltr>} label={"פניות חדשות\nב־7 ימים אחרונים"} badge={<><Ltr>+{metrics.newLeadsToday}</Ltr> היום</>} badgeTone="accent" />
        <StatTile href={`${base}/calendar`} icon={CalendarCheck} value={String(metrics.upcoming7)} label={`${vocab.bookings} קרובים\nב־7 ימים`} badge={`${metrics.upcomingToday} היום`} badgeTone="soft" />
      </PageHeader>

      {/* On a phone the two column groups dissolve (`contents`) so their cards
          can be re-ordered as one list: the profile sits right under the deal
          cards that select it, instead of five scrolls further down. */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
        <div className="contents lg:col-span-8 lg:grid lg:grid-cols-2 lg:content-start lg:gap-4">
          <SectionCard
            title={vocab.dealsTitle}
            className="order-1 lg:order-none lg:col-span-2"
            menu={[
              { label: `כל ה${vocab.people}`, href: `${base}/contacts` },
              { label: "צינור המכירות", href: `${base}/pipeline` },
              { label: "היומן", href: `${base}/calendar` },
            ]}
          >
            <DealCards deals={deals} catalog={data.catalog} stages={data.pack.stages} detailBase={`${base}/contacts`} selectedId={selected.id} onSelect={setSelectedId} />
          </SectionCard>
          <RevenueCard className="order-4 lg:order-none lg:col-span-2" data={data} base={base} />
          <CalendarCard className="order-5 lg:order-none" appointments={data.appointments} contacts={data.contacts} now={data.now} base={base} title={vocab.upcoming} />
          <FunnelCard className="order-6 lg:order-none" metrics={metrics} base={base} peopleLabel={vocab.people} />
        </div>

        <div className="contents lg:col-span-4 lg:grid lg:content-start lg:gap-4">
          <div className="order-2 lg:order-none">
            <ProfileCard contact={selected} data={data} base={base} />
          </div>
          <div className="order-3 lg:order-none">
            <DetailsCard contact={selected} data={data} base={base} />
          </div>
        </div>

        <div className="order-7 grid grid-cols-1 gap-3 md:gap-4 lg:order-none lg:col-span-12 lg:grid-cols-3">
          <AgentWorkCard data={data} metrics={metrics} />
          <RoiCard data={data} metrics={metrics} />
          <NeedsYouCard data={data} metrics={metrics} base={base} />
        </div>
      </div>
    </div>
  )
}
