import { notFound } from "next/navigation"

import { CatalogView } from "@/components/crm/catalog/catalog-view"
import { EmptyWorkspace } from "@/components/crm/live/empty-workspace"
import { getLiveCrm, getProfileAccess } from "@/lib/crm/live"
import { addCatalogPhoto, deleteCatalogItem, makeCoverPhoto, removeCatalogPhoto, saveCatalogItem } from "./actions"

export const metadata = { title: "קטלוג" }

export default async function CatalogPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const [data, access] = await Promise.all([getLiveCrm(tenant), getProfileAccess(tenant)])
  if (!data) notFound()

  // Owners manage the catalog themselves. Everyone else on the team sees it read-only.
  if (!access.canEdit) {
    if (data.catalog.length === 0) {
      return <EmptyWorkspace title={data.pack.vocab.catalog} heading={`עוד אין ${data.pack.vocab.catalog} בקטלוג`} text="בעלי העסק מוסיפים כאן את הפריטים, המחירים והתמונות שהסוכנים שולחים ללקוחות." />
    }
    return <CatalogView data={data} />
  }

  return (
    <CatalogView
      data={data}
      actions={{
        save: saveCatalogItem.bind(null, tenant),
        remove: deleteCatalogItem.bind(null, tenant),
        addPhoto: addCatalogPhoto.bind(null, tenant),
        removePhoto: removeCatalogPhoto.bind(null, tenant),
        makeCover: makeCoverPhoto.bind(null, tenant),
      }}
    />
  )
}
