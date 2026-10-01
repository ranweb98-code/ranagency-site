import { notFound } from "next/navigation"

import { AgentsView } from "@/components/crm/agents/agents-view"
import { getCrm } from "@/lib/crm/repository"

export const revalidate = 3600

export const metadata = { title: "סוכנים" }

export default async function AgentsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <AgentsView data={data} />
}
