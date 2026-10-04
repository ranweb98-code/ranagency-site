import { notFound } from "next/navigation"

import { AgentsLive } from "@/components/crm/agents/agents-live"
import { getLiveCrm } from "@/lib/crm/live"

export const metadata = { title: "סוכנים" }

export default async function AgentsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getLiveCrm(tenant)
  if (!data) notFound()
  return <AgentsLive data={data} />
}
