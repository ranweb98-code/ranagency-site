"use client"

import { CalendarCheck, CalendarClock, ChevronLeft, ChevronRight, Hourglass } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { ChannelDot } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { IconButton } from "@/components/crm/ui/icon-button"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { dayDiff, formatMonth, formatSlot, formatTime, toDayKey } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"
import type { Appointment, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
const CHIP_TONES = ["bg-crm-accent text-white", "bg-crm-accent-2 text-white", "bg-crm-warm text-crm-ink", "bg-crm-ink text-white"]
const pad = (n: number) => String(n).padStart(2, "0")

export function CalendarView({ data, metrics }: { data: CrmData; metrics: Metrics }) {
  const { pack, appointments, contacts, now } = data
  const base = data.basePath
  const todayKey = toDayKey(now)
  const [year0, month0] = todayKey.split("-").map(Number)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(todayKey)

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])
  const labelIndex = useMemo(() => new Map(pack.appointmentLabels.map((l, i) => [l, i])), [pack.appointmentLabels])

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = toDayKey(a.at)
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [appointments])

  const total = year0 * 12 + (month0 - 1) + offset
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const monthKey = `${year}-${pad(month)}`
  const monthLabel = formatMonth(new Date(Date.UTC(year, month - 1, 15, 12)).toISOString())

  const agenda = byDay.get(selected) ?? []
  const comingUp = appointments.filter((a) => Date.parse(a.at) >= Date.parse(now)).slice(0, 5)
  const pending = appointments.filter((a) => a.status === "pending" && Date.parse(a.at) >= Date.parse(now)).length
  const selectedLabel = formatSlot(`${selected}T12:00:00Z`, now).split(" ב-")[0]

  return (
    <div>
      <PageHeader title="יומן" eyebrow={`${pack.vocab.bookings} שהסוכנים קבעו, מסונכרנים אוטומטית`}>
        <StatTile icon={CalendarClock} value={String(metrics.upcomingToday)} label={`${pack.vocab.bookings}\nהיום`} />
        <StatTile icon={CalendarCheck} value={String(metrics.upcoming7)} label={`${pack.vocab.bookings}\nב־7 ימים`} badgeTone="soft" />
        <StatTile icon={Hourglass} value={String(pending)} label={"ממתינים\nלאישור"} badge={pending ? "דורש תשומת לב" : undefined} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Glass className="p-3.5 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <IconButton label="החודש הקודם" onClick={() => setOffset((o) => o - 1)}>
              <ChevronRight />
            </IconButton>
            <div className="text-center">
              <h2 className="text-xl font-medium">{monthLabel}</h2>
              {offset !== 0 ? (
                <button type="button" onClick={() => { setOffset(0); setSelected(todayKey) }} className="text-[11px] text-crm-muted underline underline-offset-4">
                  חזרה להיום
                </button>
              ) : null}
            </div>
            <IconButton label="החודש הבא" onClick={() => setOffset((o) => o + 1)}>
              <ChevronLeft />
            </IconButton>
          </div>

          <div aria-hidden className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] text-crm-muted md:gap-1.5 md:text-[11px]">
            {WEEKDAYS.map((d) => (
              <span key={d}>
                <span className="md:hidden">{d[0] === "ש" ? d.slice(0, 2) : d[0]}</span>
                <span className="hidden md:inline">{d}</span>
              </span>
            ))}
          </div>

          <div role="group" aria-label={monthLabel} className="grid grid-cols-7 gap-1 md:gap-1.5">
            {Array.from({ length: lead }).map((_, i) => (
              <span key={`lead-${i}`} aria-hidden />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const key = `${monthKey}-${pad(day)}`
              const list = byDay.get(key) ?? []
              const isToday = key === todayKey
              const isSelected = key === selected
              const past = dayDiff(`${key}T12:00:00Z`, now) < 0
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "flex aspect-square flex-col rounded-[14px] p-1.5 text-start transition-all duration-200 md:aspect-auto md:min-h-[96px] md:rounded-[18px] md:p-2",
                    isSelected ? "bg-white shadow-[0_10px_28px_-16px_rgba(24,32,64,0.55)]" : "bg-black/[0.045] hover:bg-white/70",
                    past && !isSelected && "bg-black/[0.025]",
                    isToday && "ring-2 ring-crm-ink",
                  )}
                >
                  <span className={cn("text-[11px] tabular-nums md:text-xs", isToday ? "font-semibold" : "text-crm-ink/60")}>
                    {day}
                    <span className="sr-only">
                      {" "}
                      ב{monthLabel.split(" ")[0]}
                      {list.length ? `, ${list.length} ${list.length === 1 ? pack.vocab.booking : pack.vocab.bookings}` : ""}
                    </span>
                  </span>
                  {/* phones: dots; desktop: readable chips */}
                  <span className="mt-auto flex flex-wrap gap-0.5 md:hidden">
                    {list.slice(0, 4).map((a) => (
                      <span key={a.id} className={cn("size-1.5 rounded-full", CHIP_TONES[(labelIndex.get(a.label) ?? 0) % 4].split(" ")[0])} />
                    ))}
                  </span>
                  <span className="mt-1.5 hidden flex-col gap-1 md:flex">
                    {list.slice(0, 2).map((a) => (
                      <span key={a.id} className={cn("truncate rounded-full px-2 py-0.5 text-[10px] font-medium", CHIP_TONES[(labelIndex.get(a.label) ?? 0) % 4])}>
                        {formatTime(a.at)} {contactById.get(a.contactId)?.name.split(" ")[0]}
                      </span>
                    ))}
                    {list.length > 2 ? <span className="px-1 text-[10px] text-crm-muted">+{list.length - 2} נוספים</span> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </Glass>

        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:content-start">
          <Glass className="p-4 md:p-5">
            <h2 className="text-[15px] font-medium">{selected === todayKey ? "היום" : selectedLabel}</h2>
            <p className="mb-3 text-[11px] text-crm-muted">{agenda.length ? `${agenda.length} ${agenda.length === 1 ? pack.vocab.booking : pack.vocab.bookings}` : `אין ${pack.vocab.bookings} ביום הזה`}</p>
            <ul className="space-y-2" aria-live="polite">
              {agenda.map((a) => (
                <AgendaRow key={a.id} appointment={a} base={base} contact={contactById.get(a.contactId)} />
              ))}
            </ul>
          </Glass>

          <Glass className="p-4 md:p-5">
            <h2 className="mb-3 text-[15px] font-medium">הבאים בתור</h2>
            <ul className="space-y-2">
              {comingUp.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => { setOffset(0); setSelected(toDayKey(a.at)) }} className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.045] px-3 py-2.5 text-start transition-colors hover:bg-black/[0.08]">
                    <Avatar name={contactById.get(a.contactId)?.name ?? ""} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{contactById.get(a.contactId)?.name}</span>
                      <span className="block truncate text-[11px] text-crm-muted">{a.label}</span>
                    </span>
                    <span className="text-[11px] tabular-nums text-crm-ink/70">{formatSlot(a.at, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Glass>
        </div>
      </div>
    </div>
  )
}

function AgendaRow({ appointment, contact, base }: { appointment: Appointment; contact?: CrmData["contacts"][number]; base: string }) {
  if (!contact) return null
  return (
    <li className="flex items-center gap-3 rounded-[20px] bg-white/75 p-3">
      <span className="grid w-12 shrink-0 place-items-center rounded-2xl bg-crm-ink py-2 text-[13px] font-semibold tabular-nums text-white">{formatTime(appointment.at)}</span>
      <div className="min-w-0 flex-1">
        <Link href={`${base}/contacts/${contact.id}`} className="block truncate text-[13.5px] font-medium hover:underline">
          {contact.name}
        </Link>
        <p className="truncate text-[11px] text-crm-muted">{appointment.label}</p>
      </div>
      <span className="flex flex-col items-end gap-1.5">
        <ChannelDot channel={contact.channel} className="size-5 [&_svg]:size-3" />
        {appointment.status === "pending" ? <Pill tone="warm">ממתין</Pill> : null}
      </span>
    </li>
  )
}
