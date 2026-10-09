import { toDayKey } from "./format"
import { shiftDay, shiftMonth } from "./finance"
import type { CrmData } from "./types"

// Closed revenue over time, for the overview chart. A deal counts on the day it
// reached the last stage (`closedAt`), the same rule the "closed in 30 days"
// figure uses, so the chart and the tiles above it always agree. Pure (no I/O,
// no clock: "today" is `data.now`), so it renders the same on server and client.

export type RevenueRange = "30d" | "12w" | "6m"

export const REVENUE_RANGES: { id: RevenueRange; label: string }[] = [
  { id: "30d", label: "30 יום" },
  { id: "12w", label: "12 שבועות" },
  { id: "6m", label: "6 חודשים" },
]

export interface RevenueBucket {
  /** First and last day covered, `YYYY-MM-DD` (inclusive). */
  from: string
  to: string
  /** Short axis label: "9.10", or "אוק׳" for a month. */
  label: string
  total: number
  count: number
  /** The newest bucket, and a month that is not over yet. */
  current: boolean
  partial: boolean
}

export interface RevenueSeries {
  range: RevenueRange
  kind: "day" | "week" | "month"
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

const MONTHS_SHORT = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"]

/** "2026-10-09" → "9.10". */
export const shortDay = (day: string): string => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}`

export function revenueSeries(data: CrmData, range: RevenueRange): RevenueSeries {
  const lastStage = data.pack.stages[data.pack.stages.length - 1].id
  const days = new Map<string, { total: number; count: number }>()
  for (const c of data.contacts) {
    if (c.stageId !== lastStage || !c.closedAt) continue
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

  let kind: RevenueSeries["kind"]
  let spans: { from: string; to: string; label: string; partial: boolean }[]
  let previous: { from: string; to: string }

  if (range === "30d") {
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

/** Axis ticks: a "nice" step so the top gridline is a round number just above the data. */
export function niceScale(max: number, intervals = 3): { top: number; step: number } {
  if (!(max > 0)) return { top: intervals * 1000, step: 1000 }
  const rough = max / intervals
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude
  return { top: step * intervals, step }
}
