import { notFound } from "next/navigation"

import { PipelineBoard } from "@/components/crm/pipeline/pipeline-board"
import { getLiveCrm } from "@/lib/crm/live"
import { moveStage } from "../actions"

export const metadata = { title: "צינור מכירות" }

export default async function PipelinePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getLiveCrm(tenant)
  if (!data) notFound()
  return <PipelineBoard data={data} moveStage={moveStage.bind(null, data.tenant.slug)} />
}
