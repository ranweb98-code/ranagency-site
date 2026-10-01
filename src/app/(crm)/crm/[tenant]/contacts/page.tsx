import { notFound } from "next/navigation"

import { ContactsView } from "@/components/crm/contacts/contacts-view"
import { getCrm } from "@/lib/crm/repository"

export const metadata = { title: "לקוחות" }

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ temp?: string }>
}) {
  const [{ tenant }, { temp }] = await Promise.all([params, searchParams])
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <ContactsView data={data} initialTemp={temp} />
}
