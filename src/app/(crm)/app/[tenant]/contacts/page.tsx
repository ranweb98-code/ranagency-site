import { notFound } from "next/navigation"

import { ContactsEntry } from "@/components/crm/contacts/contacts-entry"
import { getLiveCrm } from "@/lib/crm/live"

export const metadata = { title: "לקוחות" }

export default async function ContactsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getLiveCrm(tenant)
  if (!data) notFound()
  return <ContactsEntry data={data} />
}
