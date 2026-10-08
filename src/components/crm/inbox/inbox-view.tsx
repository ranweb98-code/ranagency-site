"use client"

import { Flame, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { CHANNELS, ChannelDot, ChannelTag } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"
import { formatRelative } from "@/lib/crm/format"
import type { Channel, Contact, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"
import { ThreadPanel } from "./thread-panel"

type Filter = "all" | "unread" | "mine" | "hot" | Channel

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "הכול" },
  { value: "unread", label: "לא נקראו" },
  { value: "mine", label: "בטיפולי" },
  { value: "hot", label: "חמים" },
]

export function InboxView({ data, initialId }: { data: CrmData; initialId?: string }) {
  const lastStage = data.pack.stages[data.pack.stages.length - 1].id
  // Conversations about deals that already closed are history, not inbox.
  const threads = useMemo(() => data.contacts.filter((c) => c.stageId !== lastStage), [data.contacts, lastStage])

  // One chip per channel the business actually runs, and only when there is more than one to tell apart.
  const channelFilters: { value: Filter; label: string }[] = data.tenant.agents.length > 1 ? data.tenant.agents.map((a) => ({ value: a, label: CHANNELS[a].label })) : []
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(() => (threads.some((c) => c.id === initialId) ? (initialId as string) : threads[0]?.id))
  const [threadOpen, setThreadOpen] = useState(Boolean(initialId))

  const visible = threads.filter((c) => {
    if (filter === "unread" && !c.unread) return false
    if (filter === "mine" && c.handledBy !== "human") return false
    if (filter === "hot" && c.temperature !== "hot") return false
    if (filter in CHANNELS && c.channel !== filter) return false
    const q = query.trim()
    return !q || c.name.includes(q) || c.phone.replace(/-/g, "").includes(q.replace(/-/g, ""))
  })
  const selected = threads.find((c) => c.id === selectedId) ?? threads[0]
  const unreadTotal = threads.reduce((s, c) => s + c.unread, 0)

  return (
    <div>
      <PageHeader title="שיחות" eyebrow={`${unreadTotal} הודעות שלא נקראו · כל הערוצים במקום אחד`} />

      <div className="grid h-[calc(100dvh-250px)] min-h-[540px] gap-3 md:h-[calc(100dvh-220px)] md:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px]">
        {/* ── conversation list ───────────────────────────────────── */}
        <Glass className={cn("flex min-h-0 flex-col p-3", threadOpen && "max-lg:hidden")}>
          <label className="mb-2.5 flex items-center gap-2 rounded-full bg-black/[0.06] px-4 py-2.5 text-sm">
            <Search className="size-4 text-crm-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש שם או טלפון"
              aria-label="חיפוש שיחה"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-crm-muted"
            />
          </label>
          <div role="radiogroup" aria-label="סינון שיחות" className="crm-hide-scrollbar mb-2.5 flex gap-1.5 overflow-x-auto">
            {[...FILTERS, ...channelFilters].map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors", filter === f.value ? "bg-crm-ink text-white" : "bg-black/[0.06] text-crm-ink/70 hover:bg-black/10")}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="crm-scroll -me-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pe-1">
            {visible.length === 0 ? <li className="px-4 py-10 text-center text-sm text-crm-muted">אין שיחות שמתאימות לסינון</li> : null}
            {visible.map((c) => (
              <li key={c.id}>
                <ConversationRow
                  contact={c}
                  now={data.now}
                  active={c.id === selected?.id}
                  onSelect={() => {
                    setSelectedId(c.id)
                    setThreadOpen(true)
                  }}
                />
              </li>
            ))}
          </ul>
        </Glass>

        {/* ── thread + context ────────────────────────────────────── */}
        {selected ? (
          <ThreadPanel key={selected.id} data={data} contact={selected} className={cn(!threadOpen && "max-lg:hidden")} onBack={() => setThreadOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}

function ConversationRow({ contact, now, active, onSelect }: { contact: Contact; now: string; active: boolean; onSelect: () => void }) {
  const last = [...contact.messages].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]
  // A lead added by hand has no messages yet: show its summary instead.
  const who = !last || last.from === "customer" ? "" : last.from === "human" ? "את/ה: " : "הסוכן: "
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active}
      className={cn("flex w-full items-start gap-3 rounded-[22px] p-3 text-start transition-colors", active ? "bg-white shadow-[0_10px_30px_-18px_rgba(24,32,64,0.5)]" : "hover:bg-white/55")}
    >
      <span className="relative shrink-0">
        <Avatar name={contact.name} size="md" />
        <ChannelDot channel={contact.channel} className="absolute -bottom-0.5 -end-0.5 size-4 ring-2 ring-white [&_svg]:size-2.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("truncate text-[13.5px]", contact.unread ? "font-semibold" : "font-medium")}>{contact.name}</span>
            {contact.temperature === "hot" ? <Flame className="size-3.5 shrink-0 text-[#ff5b2e]" aria-label="ליד חם" /> : null}
          </span>
          <span className="shrink-0 text-[10.5px] text-crm-muted">{formatRelative(last?.at ?? contact.lastContactAt, now)}</span>
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <ChannelTag channel={contact.channel} className="py-0 text-[10px]" />
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn("truncate text-xs", contact.unread ? "text-crm-ink" : "text-crm-muted")}>
            {who}
            {last?.attachmentItemId ? "📎 " : ""}
            {last ? last.text : contact.summary || "עוד אין הודעות"}
          </span>
          {contact.unread ? <span className="grid min-w-4 shrink-0 place-items-center rounded-full bg-crm-accent px-1 text-[10px] leading-4 text-white">{contact.unread}</span> : null}
        </span>
      </span>
    </button>
  )
}
