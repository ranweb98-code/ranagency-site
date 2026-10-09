import { toDayKey } from "./format"
import { shiftDay, shiftMonth } from "./finance"
import type { CrmData } from "./types"

// Closed revenue over time, for the overview chart. A deal counts on the day it
// reached the last stage (`closedAt`), the same rule the "closed in 30 days"
// figure uses, so the chart and the tiles above it always agree. Pure (no I/O,
// no clock: "today" is `data.now`), so it renders the same on server and client.

export type RevenueRange = "24h" | "7d" | "30d" | "12w" | "6m"

export const REVENUE_RANGES: { id: RevenueRange; label: string; window: string }[] = [
  { id: "24h", label: "היום", window: "24 השעות האחרונות" },
  { id: "7d", label: "השבוע", window: "7 הימים האחרונים" },
  { id: "30d", label: "30 יום", window: "30 הימים האחרונים" },
  { id: "12w", label: "12 שבועות", window: "12 השבועות האחרונים" },
  { id: "6m", label: "6 חודשים", window: "6 החודשים האחרונים" },
]

export interface RevenueBucket {
  /** First and last day covered, `YYYY-MM-DD` (inclusive). For an hour: the
   *  start and the end of the hour as ISO timestamps. */
  from: string
  to: string
  /** Short axis label: "14:00", "ה׳ 9.10", "9.10", or "אוק׳" for a month. */
  label: string
  /** Which day an hour belongs to ("היום" / "אתמול"); empty for the other kinds. */
  dayTag: string
  total: number
  count: number
  /** The newest bucket, and a month that is not over yet. */
  current: boolean
  partial: boolean
}

export interface RevenueSeries {
  range: RevenueRange
  kind: "hour" | "day" | "week" | "month"
  buckets: RevenueBucket[]
  total: number
  count: number
  /** The same length of time just before this range. */
  previousTotal: number
  /** Percent change against `previousTotal`; `null` when there is nothing to compare to. */
  delta: number | null
  average: number
  peak: RevenueBucket | null
}

const HOUR = 3_600_000
const WEEKDAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
const hourLabel = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

const MONTHS_SHORT = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"]

/** "2026-10-09" → "9.10". */
export const shortDay = (day: string): string => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}`

export function revenueSeries(data: CrmData, range: RevenueRange): RevenueSeries {
  const lastStage = data.pack.stages[data.pack.stages.length - 1].id
  const days = new Map<string, { total: number; count: number }>()
  const closings: { at: number; value: number }[] = []
  for (const c of data.contacts) {
    if (c.stageId !== lastStage || !c.closedAt) continue
    closings.push({ at: Date.parse(c.closedAt), value: c.value })
    const day = toDayKey(c.closedAt)
    const entry = days.get(day) ?? { total: 0, count: 0 }
    entry.total += c.value
    entry.count += 1
    days.set(day, entry)
  }

  const sum = (from: string, to: string) => {
    let total = 0
    let count = 0
    for (const [day, entry] of days) {
      if (day >= from && day <= to) {
        total += entry.total
        count += entry.count
      }
    }
    return { total, count }
  }

  const today = toDayKey(data.now)
  const thisMonth = today.slice(0, 7)

  if (range === "24h") return hourlySeries(closings, Date.parse(data.now), today)

  let kind: RevenueSeries["kind"]
  let spans: { from: string; to: string; label: string; partial: boolean }[]
  let previous: { from: string; to: string }

  if (range === "7d") {
    kind = "day"
    spans = Array.from({ length: 7 }, (_, i) => {
      const day = shiftDay(today, -(6 - i))
      return { from: day, to: day, label: `${WEEKDAYS_SHORT[new Date(`${day}T00:00:00Z`).getUTCDay()]} ${shortDay(day)}`, partial: false }
    })
    previous = { from: shiftDay(today, -13), to: shiftDay(today, -7) }
  } else if (range === "30d") {
    kind = "day"
    spans = Array.from({ length: 30 }, (_, i) => {
      const day = shiftDay(today, -(29 - i))
      return { from: day, to: day, label: shortDay(day), partial: false }
    })
    previous = { from: shiftDay(today, -59), to: shiftDay(today, -30) }
  } else if (range === "12w") {
    kind = "week"
    spans = Array.from({ length: 12 }, (_, i) => {
      const to = shiftDay(today, -7 * (11 - i))
      const from = shiftDay(to, -6)
      return { from, to, label: shortDay(from), partial: false }
    })
    previous = { from: shiftDay(today, -167), to: shiftDay(today, -84) }
  } else {
    kind = "month"
    spans = Array.from({ length: 6 }, (_, i) => {
      const month = shiftMonth(thisMonth, -(5 - i))
      return { from: `${month}-01`, to: `${month}-31`, label: MONTHS_SHORT[Number(month.slice(5, 7)) - 1], partial: month === thisMonth }
    })
    previous = { from: `${shiftMonth(thisMonth, -11)}-01`, to: `${shiftMonth(thisMonth, -6)}-31` }
  }

  const buckets: RevenueBucket[] = spans.map((span, i) => ({
    from: span.from,
    to: span.to > today ? today : span.to,
    label: span.label,
    dayTag: "",
    ...sum(span.from, span.to),
    current: i === spans.length - 1,
    partial: span.partial,
  }))

  const total = buckets.reduce((s, b) => s + b.total, 0)
  const count = buckets.reduce((s, b) => s + b.count, 0)
  const previousTotal = sum(previous.from, previous.to).total
  const peak = buckets.reduce<RevenueBucket | null>((best, b) => (b.total > 0 && (!best || b.total > best.total) ? b : best), null)

  return {
    range,
    kind,
    buckets,
    total,
    count,
    previousTotal,
    delta: previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null,
    average: count > 0 ? Math.round(total / count) : 0,
    peak,
  }
}

/** The last 24 hours, one column per hour, the current (unfinished) hour last. */
function hourlySeries(closings: { at: number; value: number }[], nowMs: number, today: string): RevenueSeries {
  const lastStart = Math.floor(nowMs / HOUR) * HOUR
  const firstStart = lastStart - 23 * HOUR
  const within = (from: number, to: number) => closings.filter((c) => c.at >= from && c.at < to)

  const buckets: RevenueBucket[] = Array.from({ length: 24 }, (_, i) => {
    const start = firstStart + i * HOUR
    const rows = within(start, start + HOUR)
    return {
      from: new Date(start).toISOString(),
      to: new Date(start + HOUR).toISOString(),
      label: hourLabel.format(new Date(start)),
      dayTag: toDayKey(new Date(start)) === today ? "היום" : "אתמול",
      total: rows.reduce((sum, c) => sum + c.value, 0),
      count: rows.length,
      current: i === 23,
      partial: i === 23,
    }
  })

  const total = buckets.reduce((sum, b) => sum + b.total, 0)
  const count = buckets.reduce((sum, b) => sum + b.count, 0)
  const previousTotal = within(firstStart - 24 * HOUR, firstStart).reduce((sum, c) => sum + c.value, 0)
  const peak = buckets.reduce<RevenueBucket | null>((best, b) => (b.total > 0 && (!best || b.total > best.total) ? b : best), null)

  return {
    range: "24h",
    kind: "hour",
    buckets,
    total,
    count,
    previousTotal,
    delta: previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null,
    average: count > 0 ? Math.round(total / count) : 0,
    peak,
  }
}

/** Axis ticks: a "nice" step so the top gridline is a round number just above the data. */
export function niceScale(max: number, intervals = 3): { top: number; step: number } {
  if (!(max > 0)) return { top: intervals * 1000, step: 1000 }
  const rough = max / intervals
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude
  return { top: step * intervals, step }
}
