import { dayDiff } from "./format"
import type { Contact, CrmData, Stage } from "./types"

const DAY = 86_400_000

export interface FunnelRow {
  stage: Stage
  count: number
  total: number
  weighted: number
}

export interface Metrics {
  /** Money from deals that reached the last stage in the past 30 days. */
  closed30: number
  closedPrev30: number
  closedCount30: number
  /** Percentage change vs. the previous 30 days; null when there is no baseline. */
  closedDelta: number | null
  newLeads7: number
  newLeadsToday: number
  upcoming7: number
  upcomingToday: number
  pipelineTotal: number
  pipelineWeighted: number
  funnel: FunnelRow[]
  avgReplySeconds: number
  conversion: number
  afterHours: number
  hoursSaved: number
  /** Closed revenue ÷ monthly plan price. */
  roi: number
  hotOpen: Contact[]
  needsHuman: number
}

export function computeMetrics(data: CrmData): Metrics {
  const { contacts, appointments, pack, tenant, now } = data
  const nowMs = Date.parse(now)
  const lastStageId = pack.stages[pack.stages.length - 1].id

  const won = contacts.filter((c) => c.stageId === lastStageId && c.closedAt)
  const inWindow = (c: Contact, from: number, to: number) => {
    const t = Date.parse(c.closedAt as string)
    return t >= nowMs - to * DAY && t < nowMs - from * DAY
  }
  const closed = won.filter((c) => inWindow(c, 0, 30))
  const prev = won.filter((c) => inWindow(c, 30, 60))
  const closed30 = sum(closed.map((c) => c.value))
  const closedPrev30 = sum(prev.map((c) => c.value))

  const open = contacts.filter((c) => c.stageId !== lastStageId)
  const funnel: FunnelRow[] = pack.stages
    .slice(0, -1)
    .map((stage) => {
      const rows = open.filter((c) => c.stageId === stage.id)
      const total = sum(rows.map((c) => c.value))
      return { stage, count: rows.length, total, weighted: total * stage.probability }
    })

  const upcoming = appointments.filter((a) => Date.parse(a.at) >= nowMs)
  const afterHours = contacts.filter((c) => isAfterHours(c.createdAt)).length
  // 0 = no agent reply recorded (manual leads); it would drag the average down
  const replies = contacts.map((c) => c.firstReplySeconds).filter((s) => s > 0)

  return {
    closed30,
    closedPrev30,
    closedCount30: closed.length,
    closedDelta: closedPrev30 > 0 ? Math.round(((closed30 - closedPrev30) / closedPrev30) * 100) : null,
    newLeads7: contacts.filter((c) => nowMs - Date.parse(c.createdAt) <= 7 * DAY).length,
    newLeadsToday: contacts.filter((c) => nowMs - Date.parse(c.createdAt) <= DAY).length,
    upcoming7: upcoming.filter((a) => dayDiff(a.at, now) <= 7).length,
    upcomingToday: upcoming.filter((a) => dayDiff(a.at, now) === 0).length,
    pipelineTotal: sum(funnel.map((f) => f.total)),
    pipelineWeighted: Math.round(sum(funnel.map((f) => f.weighted))),
    funnel,
    avgReplySeconds: replies.length ? Math.round(sum(replies) / replies.length) : 0,
    conversion: contacts.length ? Math.round((won.length / contacts.length) * 100) : 0,
    afterHours,
    hoursSaved: Math.round((contacts.length * 6) / 60),
    roi: tenant.planMonthly ? Math.round((closed30 / tenant.planMonthly) * 10) / 10 : 0,
    hotOpen: open.filter((c) => c.temperature === "hot").sort((a, b) => b.value - a.value),
    needsHuman: open.filter((c) => c.handledBy === "human").length,
  }
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

/** Evenings, early mornings and weekends — when nobody is at the desk. */
function isAfterHours(iso: string): boolean {
  const date = new Date(iso)
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", hour12: false }).format(date)) % 24
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", weekday: "short" }).format(date)
  return hour < 8 || hour >= 20 || weekday === "Fri" || weekday === "Sat"
}

