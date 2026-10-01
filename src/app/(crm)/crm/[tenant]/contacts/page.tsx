import { notFound } from "next/navigation"

import { ContactsEntry } from "@/components/crm/contacts/contacts-entry"
import { getCrm } from "@/lib/crm/repository"

export const revalidate = 3600

export const metadata = { title: "לקוחות" }

export default async function ContactsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <ContactsEntry data={data} />
}
