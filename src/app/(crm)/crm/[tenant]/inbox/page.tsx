import { notFound } from "next/navigation"

import { InboxEntry } from "@/components/crm/inbox/inbox-entry"
import { getCrm } from "@/lib/crm/repository"

export const revalidate = 3600

export const metadata = { title: "שיחות" }

export default async function InboxPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <InboxEntry data={data} />
}
