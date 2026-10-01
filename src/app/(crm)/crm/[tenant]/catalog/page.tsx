import { notFound } from "next/navigation"

import { CatalogView } from "@/components/crm/catalog/catalog-view"
import { getCrm } from "@/lib/crm/repository"

export const metadata = { title: "קטלוג" }

export default async function CatalogPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()
  return <CatalogView data={data} />
}
