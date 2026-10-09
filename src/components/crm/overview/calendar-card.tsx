"use client"

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { IconButton } from "@/components/crm/ui/icon-button"
import { SectionCard } from "@/components/crm/ui/section-card"
import { formatMonth, formatTime, toDayKey } from "@/lib/crm/format"
import type { Appointment, Contact } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
// The days that carry something get the brand colours in rotation, as in the
// reference; cycling by day number keeps neighbours from matching.
const DAY_TONES = ["bg-crm-accent-2 text-white", "bg-crm-warm text-crm-ink", "bg-crm-accent text-white", "bg-crm-ink text-white"]

const pad = (n: number) => String(n).padStart(2, "0")

export function CalendarCard({
  appointments,
  contacts,
  now,
  base,
  title,
  className,
}: {
  appointments: Appointment[]
  contacts: Contact[]
  now: string
  base: string
  title: string
  className?: string
}) {
  const todayKey = toDayKey(now)
  const [year0, month0] = todayKey.split("-").map(Number)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(todayKey)

  const view = useMemo(() => {
    const total = year0 * 12 + (month0 - 1) + offset
    const year = Math.floor(total / 12)
    const month = (total % 12) + 1
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
    return { year, month, daysInMonth, lead, key: `${year}-${pad(month)}` }
  }, [year0, month0, offset])

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const key = toDayKey(a.at)
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [appointments])

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])
  const agenda = byDay.get(selected) ?? []
  const monthLabel = formatMonth(new Date(Date.UTC(view.year, view.month - 1, 15, 12)).toISOString())

  return (
    <SectionCard
      title={title}
      className={className}
      bodyClassName="flex flex-col"
      actions={
        <Link href={`${base}/calendar`} aria-label="פתיחת היומן המלא">
          <IconButton label="פתיחת היומן המלא" size="sm" tabIndex={-1} className="pointer-events-none">
            <CalendarDays />
          </IconButton>
        </Link>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="החודש הקודם" size="md" onClick={() => setOffset((o) => o - 1)}>
          <ChevronRight />
        </IconButton>
        <span className="text-lg font-medium">{monthLabel}</span>
        <IconButton label="החודש הבא" size="md" onClick={() => setOffset((o) => o + 1)}>
          <ChevronLeft />
        </IconButton>
      </div>

      <div aria-hidden className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[10px] text-crm-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div role="group" aria-label={monthLabel} className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: view.lead }).map((_, i) => (
          <span key={`lead-${i}`} aria-hidden />
        ))}
        {Array.from({ length: view.daysInMonth }).map((_, i) => {
          const day = i + 1
          const key = `${view.key}-${pad(day)}`
          const list = byDay.get(key) ?? []
          const isToday = key === todayKey
          const isSelected = key === selected
          const tone = list.length ? DAY_TONES[day % DAY_TONES.length] : "bg-black/[0.05] text-crm-muted"
          const names = list.map((a) => contactById.get(a.contactId)?.name).filter((n): n is string => Boolean(n))
          return (
            <button
              key={key}
              type="button"
              aria-label={`${day} ב${monthLabel.split(" ")[0]}${list.length ? `, ${list.length} באותו יום` : ""}`}
              aria-pressed={isSelected}
              onClick={() => setSelected(key)}
              className={cn(
                "relative flex aspect-square flex-col items-start justify-between rounded-xl p-1.5 text-[10px] transition-transform duration-200 hover:scale-[1.06]",
                tone,
                isToday && "ring-2 ring-crm-ink ring-offset-1 ring-offset-white/60",
                isSelected && !isToday && "ring-2 ring-white",
              )}
            >
              <span className="flex [&>*+*]:-ms-1.5">
                {names.slice(0, 2).map((name) => (
                  <Avatar key={name} name={name} size="xs" decorative className="size-4 text-[7px] ring-1 ring-white" />
                ))}
              </span>
              <span className="leading-none tabular-nums">{day}</span>
            </button>
          )
        })}
      </div>

      <ul className="mt-auto space-y-1.5 pt-3" aria-live="polite">
        {agenda.length === 0 ? (
          <li className="rounded-2xl bg-black/[0.04] px-3 py-2.5 text-xs text-crm-muted">אין אירועים ביום שנבחר</li>
        ) : (
          agenda.slice(0, 3).map((a) => {
            const contact = contactById.get(a.contactId)
            return (
              <li key={a.id} className="flex items-center gap-2.5 rounded-2xl bg-black/[0.04] px-3 py-2">
                <span className="text-xs font-semibold tabular-nums">{formatTime(a.at)}</span>
                <span className="min-w-0 flex-1 truncate text-xs">
                  {contact?.name} · {a.label}
                </span>
                {a.status === "pending" ? <span className="text-[10px] text-crm-muted">ממתין</span> : null}
              </li>
            )
          })
        )}
      </ul>
    </SectionCard>
  )
}
