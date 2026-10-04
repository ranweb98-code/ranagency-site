import { notFound } from "next/navigation"

import { ContactDetail } from "@/components/crm/pages/contact-detail"
import { getLiveCrm } from "@/lib/crm/live"

export const metadata = { title: "כרטיס" }

export default async function ContactPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params
  const data = await getLiveCrm(tenant)
  const contact = data?.contacts.find((c) => c.id === id)
  if (!data || !contact) notFound()
  return <ContactDetail data={data} contact={contact} />
}
