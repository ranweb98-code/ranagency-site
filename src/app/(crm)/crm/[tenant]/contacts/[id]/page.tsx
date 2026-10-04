import { notFound } from "next/navigation"

import { ContactDetail } from "@/components/crm/pages/contact-detail"
import { generateCrmData } from "@/lib/crm/demo-data"
import { getCrm, listTenants } from "@/lib/crm/repository"

export const revalidate = 3600

export const metadata = { title: "כרטיס" }

export function generateStaticParams() {
  return listTenants().flatMap((t) => generateCrmData(t).contacts.map((c) => ({ tenant: t.slug, id: c.id })))
}

export default async function ContactPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params
  const data = await getCrm(tenant)
  const contact = data?.contacts.find((c) => c.id === id)
  if (!data || !contact) notFound()
  return <ContactDetail data={data} contact={contact} />
}
