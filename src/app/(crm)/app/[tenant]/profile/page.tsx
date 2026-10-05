import { notFound } from "next/navigation"

import { ProfileView } from "@/components/crm/profile/profile-view"
import { getLiveCrm, getProfileAccess } from "@/lib/crm/live"
import { emptyProfile } from "@/lib/crm/profile"
import { saveProfile } from "../actions"

export const metadata = { title: "פרופיל העסק" }

export default async function ProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const [data, access] = await Promise.all([getLiveCrm(tenant), getProfileAccess(tenant)])
  if (!data) notFound()

  return (
    <ProfileView
      identity={{ businessName: data.tenant.businessName, ownerName: data.tenant.ownerName, tagline: data.tenant.tagline, city: data.tenant.city }}
      initialProfile={data.profile ?? emptyProfile()}
      packLabel={data.pack.label}
      knowledge={data.pack.knowledge}
      catalog={data.catalog.map((c) => ({ title: c.title, subtitle: c.subtitle, price: c.price, priceSuffix: c.priceSuffix }))}
      catalogHref={`${data.basePath}/catalog`}
      canEdit={access.canEdit}
      save={saveProfile.bind(null, data.tenant.slug)}
    />
  )
}
