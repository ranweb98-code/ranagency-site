import { notFound } from "next/navigation"

import { CalendarView } from "@/components/crm/calendar/calendar-view"
import { getLiveCrmWithMetrics } from "@/lib/crm/live"

export const metadata = { title: "יומן" }

export default async function CalendarPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const result = await getLiveCrmWithMetrics(tenant)
  if (!result) notFound()
  return <CalendarView data={result.data} metrics={result.metrics} />
}
