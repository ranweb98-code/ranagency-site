import { notFound } from "next/navigation"

import { OverviewView } from "@/components/crm/overview/overview-view"
import { getCrmWithMetrics } from "@/lib/crm/repository"

export const revalidate = 3600

export default async function OverviewPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const result = await getCrmWithMetrics(tenant)
  if (!result) notFound()
  return <OverviewView data={result.data} metrics={result.metrics} />
}
