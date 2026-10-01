import { notFound } from "next/navigation"

import { PipelineBoard } from "@/components/crm/pipeline/pipeline-board"
import { getCrm } from "@/lib/crm/repository"

export const metadata = { title: "צינור מכירות" }

export default async function PipelinePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <PipelineBoard data={data} />
}
