import { notFound } from "next/navigation"

import { InboxView } from "@/components/crm/inbox/inbox-view"
import { getCrm } from "@/lib/crm/repository"

export const metadata = { title: "שיחות" }

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ c?: string }>
}) {
  const [{ tenant }, { c }] = await Promise.all([params, searchParams])
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <InboxView data={data} initialId={c} />
}
