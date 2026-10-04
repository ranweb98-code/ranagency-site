import { notFound } from "next/navigation"

import { CatalogView } from "@/components/crm/catalog/catalog-view"
import { EmptyWorkspace } from "@/components/crm/live/empty-workspace"
import { getLiveCrm } from "@/lib/crm/live"

export const metadata = { title: "קטלוג" }

export default async function CatalogPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getLiveCrm(tenant)
  if (!data) notFound()

  if (data.catalog.length === 0) {
    return (
      <EmptyWorkspace
        title={data.pack.vocab.catalog}
        heading={`עוד אין ${data.pack.vocab.catalog} בקטלוג`}
        text="הפריטים, המחירים והתמונות שהסוכנים שולחים ללקוחות מעלים אתכם בהקמה. נעדכן אתכם כשהקטלוג מוכן."
      />
    )
  }
  return <CatalogView data={data} />
}
