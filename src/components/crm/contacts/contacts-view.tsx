"use client"

import { Flame, Search, Users, Wallet } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { CHANNELS, ChannelDot } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { Segmented } from "@/components/crm/ui/segmented"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { formatMoney, formatMoneyCompact, formatRelative } from "@/lib/crm/format"
import type { Channel, Contact, CrmData, Temperature } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

type TempFilter = "all" | Temperature
type Sort = "recent" | "value"

const TEMP_LABEL: Record<Temperature, string> = { hot: "חם", warm: "מתעניין", cold: "קר" }

export function ContactsView({ data, initialTemp }: { data: CrmData; initialTemp?: string }) {
  const { pack, catalog } = data
  const base = data.basePath
  const itemById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])

  const [temp, setTemp] = useState<TempFilter>(initialTemp === "hot" || initialTemp === "warm" || initialTemp === "cold" ? initialTemp : "all")
  const [stage, setStage] = useState("all")
  const [channel, setChannel] = useState<Channel | "all">("all")
  const [sort, setSort] = useState<Sort>("recent")
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    const q = query.trim()
    return data.contacts
      .filter((c) => (temp === "all" || c.temperature === temp) && (stage === "all" || c.stageId === stage) && (channel === "all" || c.channel === channel))
      .filter((c) => !q || c.name.includes(q) || c.phone.replace(/-/g, "").includes(q.replace(/-/g, "")))
      .sort((a, b) => (sort === "value" ? b.value - a.value : Date.parse(b.lastContactAt) - Date.parse(a.lastContactAt)))
  }, [data.contacts, temp, stage, channel, sort, query])

  const hot = data.contacts.filter((c) => c.temperature === "hot").length
  const sum = rows.reduce((s, c) => s + c.value, 0)

  return (
    <div>
      <PageHeader title={pack.vocab.people} eyebrow={`${data.contacts.length} ${pack.vocab.people} · כולם נאספו אוטומטית מהשיחות`}>
        <StatTile icon={Users} value={String(data.contacts.length)} label={`${pack.vocab.people}\nבסך הכול`} />
        <StatTile icon={Flame} value={String(hot)} label={"לידים חמים\nמחכים לך"} badge="חם" />
        <StatTile icon={Wallet} value={formatMoneyCompact(sum)} label={`שווי בתצוגה\n${rows.length} רשומות`} badgeTone="soft" />
      </PageHeader>

      <Glass className="p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-black/[0.06] px-4 py-2.5 text-sm">
            <Search className="size-4 text-crm-muted" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש שם או טלפון" aria-label="חיפוש" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-crm-muted" />
          </label>
          <div className="crm-hide-scrollbar flex items-center gap-2 overflow-x-auto">
            <Segmented<TempFilter>
              label="סינון לפי חום"
              value={temp}
              onChange={setTemp}
              options={[
                { value: "all", label: "הכול" },
                { value: "hot", label: "חמים" },
                { value: "warm", label: "מתעניינים" },
                { value: "cold", label: "קרים" },
              ]}
            />
            <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="סינון לפי שלב" className="shrink-0 rounded-full bg-black/[0.07] px-4 py-2.5 text-xs font-medium outline-none">
              <option value="all">כל השלבים</option>
              {pack.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel | "all")} aria-label="סינון לפי ערוץ" className="shrink-0 rounded-full bg-black/[0.07] px-4 py-2.5 text-xs font-medium outline-none">
              <option value="all">כל הערוצים</option>
              {data.tenant.agents.map((a) => (
                <option key={a} value={a}>
                  {CHANNELS[a].label}
                </option>
              ))}
            </select>
            <Segmented<Sort> label="מיון" value={sort} onChange={setSort} options={[{ value: "recent", label: "אחרונים" }, { value: "value", label: "לפי שווי" }]} />
          </div>
        </div>

        <div className="mt-3 hidden grid-cols-[2.2fr_1.2fr_1.6fr_1fr_.9fr_1fr] gap-3 px-4 pb-1 text-[11px] text-crm-muted md:grid">
          <span>{pack.vocab.person}</span>
          <span>שלב</span>
          <span>{pack.vocab.catalogItem}</span>
          <span>שווי</span>
          <span>ערוץ</span>
          <span>קשר אחרון</span>
        </div>

        <ul className="mt-2 space-y-1.5 md:mt-0">
          {rows.length === 0 ? <li className="rounded-2xl bg-black/[0.04] px-4 py-12 text-center text-sm text-crm-muted">אין תוצאות לסינון הזה</li> : null}
          {rows.map((c) => (
            <li key={c.id}>
              <ContactRow contact={c} stageLabel={pack.stages.find((s) => s.id === c.stageId)?.label ?? ""} itemTitle={itemById.get(c.itemId)?.title ?? ""} href={`${base}/contacts/${c.id}`} now={data.now} />
            </li>
          ))}
        </ul>
      </Glass>
    </div>
  )
}

function ContactRow({ contact, stageLabel, itemTitle, href, now }: { contact: Contact; stageLabel: string; itemTitle: string; href: string; now: string }) {
  return (
    <Link href={href} className="grid items-center gap-x-3 gap-y-1 rounded-[22px] bg-white/60 px-3.5 py-3 transition-all duration-200 hover:bg-white hover:shadow-[0_10px_30px_-20px_rgba(24,32,64,0.6)] md:grid-cols-[2.2fr_1.2fr_1.6fr_1fr_.9fr_1fr] md:px-4">
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={contact.name} size="md" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium">{contact.name}</span>
            {contact.temperature === "hot" ? <Flame className="size-3.5 shrink-0 text-[#ff5b2e]" aria-label="ליד חם" /> : null}
          </span>
          <span className="block text-[11px] text-crm-muted">
            <bdi dir="ltr">{contact.phone}</bdi>
          </span>
        </span>
      </span>
      <span>
        <Pill tone={contact.stageId === "done" ? "ink" : "soft"} className={cn("max-w-full truncate")}>
          {stageLabel}
        </Pill>
      </span>
      <span className="truncate text-[12.5px] text-crm-ink/75">{itemTitle}</span>
      <span className="text-[14px] font-semibold tabular-nums">{formatMoney(contact.value)}</span>
      <span className="flex items-center gap-1.5">
        <ChannelDot channel={contact.channel} className="size-5 [&_svg]:size-3" />
        <span className="hidden text-xs text-crm-ink/70 lg:inline">{CHANNELS[contact.channel].label}</span>
      </span>
      <span className="text-[11.5px] text-crm-muted">
        {formatRelative(contact.lastContactAt, now)}
        <span className="sr-only"> · {TEMP_LABEL[contact.temperature]}</span>
      </span>
    </Link>
  )
}
