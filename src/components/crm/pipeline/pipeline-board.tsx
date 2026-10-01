"use client"

import { BarChart3, Bot, ChevronLeft, ChevronRight, Flame, Scale, UserRound, Users } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { Avatar } from "@/components/crm/ui/avatar"
import { ChannelDot } from "@/components/crm/ui/channel"
import { IconButton } from "@/components/crm/ui/icon-button"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { formatMoney, formatMoneyCompact, formatRelative } from "@/lib/crm/format"
import type { Contact, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

export function PipelineBoard({ data }: { data: CrmData }) {
  const { pack, contacts, catalog } = data
  const base = `/crm/${data.tenant.slug}`
  const toast = useToast()
  const [stageOf, setStageOf] = useState<Record<string, string>>(() => Object.fromEntries(contacts.map((c) => [c.id, c.stageId])))
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const itemById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])
  const lastIndex = pack.stages.length - 1

  const columns = pack.stages.map((stage, index) => {
    const cards = contacts.filter((c) => stageOf[c.id] === stage.id).sort((a, b) => b.value - a.value)
    return { stage, index, cards, total: cards.reduce((s, c) => s + c.value, 0) }
  })
  const open = columns.slice(0, -1)
  const pipelineTotal = open.reduce((s, c) => s + c.total, 0)
  const weighted = open.reduce((s, c) => s + c.total * c.stage.probability, 0)
  const openCount = open.reduce((s, c) => s + c.cards.length, 0)

  const move = (contact: Contact, stageId: string) => {
    if (stageOf[contact.id] === stageId) return
    setStageOf((prev) => ({ ...prev, [contact.id]: stageId }))
    const stage = pack.stages.find((s) => s.id === stageId)
    toast(
      stageId === pack.stages[lastIndex].id
        ? `${contact.name}: נסגר · ${formatMoney(contact.value)} (הדגמה, לא נשמר)`
        : `${contact.name} הועבר ל״${stage?.label}״ (הדגמה, לא נשמר)`,
    )
  }

  const step = (contact: Contact, delta: number) => {
    const current = pack.stages.findIndex((s) => s.id === stageOf[contact.id])
    const next = pack.stages[current + delta]
    if (next) move(contact, next.id)
  }

  return (
    <div>
      <PageHeader title="צינור מכירות" eyebrow="גררו כרטיס בין שלבים, או השתמשו בחצים">
        <StatTile icon={BarChart3} value={formatMoneyCompact(pipelineTotal)} label={"ערך פתוח בצינור\nהערכה"} />
        <StatTile icon={Scale} value={formatMoneyCompact(weighted)} label={"צפי משוקלל\nלפי הסתברות שלב"} badge="הערכה" badgeTone="warm" />
        <StatTile icon={Users} value={String(openCount)} label={`${pack.vocab.people} פתוחים\nבצינור`} />
      </PageHeader>

      <div className="crm-scroll -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
        {columns.map(({ stage, index, cards, total }) => {
          const won = index === lastIndex
          const highlighted = over === stage.id
          return (
            <section
              key={stage.id}
              aria-label={stage.label}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(stage.id)
              }}
              onDragLeave={() => setOver((o) => (o === stage.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                const contact = contacts.find((c) => c.id === dragging)
                setOver(null)
                setDragging(null)
                if (contact) move(contact, stage.id)
              }}
              className={cn(
                "crm-glass-soft flex w-[84%] shrink-0 snap-start flex-col rounded-[28px] p-2.5 transition-colors duration-200 sm:w-[300px]",
                highlighted && "bg-white/70 ring-2 ring-crm-ink/40",
              )}
            >
              <header className={cn("mb-2.5 flex items-center justify-between rounded-[20px] px-3.5 py-3", won ? "bg-crm-ink text-white" : "bg-white/55")}>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: won ? "var(--crm-warm)" : `color-mix(in oklab, var(--crm-accent) ${Math.round((index / lastIndex) * 100)}%, var(--crm-accent-2))` }}
                  />
                  <h2 className="text-[13px] font-medium">{stage.label}</h2>
                  <span className={cn("text-[11px] tabular-nums", won ? "text-white/80" : "text-crm-muted")}>{cards.length}</span>
                </div>
                <span className="text-[13px] font-medium tabular-nums">{formatMoneyCompact(total)}</span>
              </header>

              <ul className="crm-scroll flex max-h-[62dvh] flex-col gap-2 overflow-y-auto pe-0.5 md:max-h-[calc(100dvh-300px)]">
                {cards.length === 0 ? (
                  <li className="rounded-[20px] border border-dashed border-black/15 px-4 py-8 text-center text-xs text-crm-muted">גררו לכאן</li>
                ) : null}
                {cards.map((contact) => {
                  const item = itemById.get(contact.itemId)
                  return (
                    <li key={contact.id}>
                      <article
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move"
                          e.dataTransfer.setData("text/plain", contact.id)
                          setDragging(contact.id)
                        }}
                        onDragEnd={() => {
                          setDragging(null)
                          setOver(null)
                        }}
                        className={cn(
                          "group cursor-grab rounded-[20px] bg-white/80 p-3.5 shadow-[0_8px_24px_-18px_rgba(24,32,64,0.45)] transition-all duration-200 active:cursor-grabbing",
                          dragging === contact.id ? "scale-[0.98] opacity-40" : "hover:-translate-y-0.5 hover:bg-white",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={contact.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <Link href={`${base}/contacts/${contact.id}`} className="block truncate text-[13px] font-medium hover:underline">
                              {contact.name}
                            </Link>
                            <p className="truncate text-[11px] text-crm-muted">{item?.title}</p>
                          </div>
                          <ChannelDot channel={contact.channel} className="size-5 [&_svg]:size-3" />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[17px] font-semibold tabular-nums">{formatMoney(contact.value)}</span>
                          <span className="flex items-center gap-1">
                            {contact.temperature === "hot" ? (
                              <Pill tone="warm">
                                <Flame className="size-3" aria-hidden />
                                חם
                              </Pill>
                            ) : null}
                            <Pill tone="soft">
                              {contact.handledBy === "human" ? <UserRound className="size-3" aria-hidden /> : <Bot className="size-3" aria-hidden />}
                              {contact.handledBy === "human" ? "אני" : "סוכן"}
                            </Pill>
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2.5">
                          <span className="text-[10.5px] text-crm-muted">{formatRelative(contact.lastContactAt, data.now)}</span>
                          <span className="flex gap-1">
                            <IconButton label={`החזרה לשלב הקודם — ${contact.name}`} size="sm" disabled={index === 0} onClick={() => step(contact, -1)} className="!size-7">
                              <ChevronRight />
                            </IconButton>
                            <IconButton label={`קידום לשלב הבא — ${contact.name}`} size="sm" tone="ink" disabled={won} onClick={() => step(contact, 1)} className="!size-7">
                              <ChevronLeft />
                            </IconButton>
                          </span>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
