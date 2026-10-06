import { notFound } from "next/navigation"

import { AccountView } from "@/components/crm/account/account-view"
import { matchPreset } from "@/lib/crm/brand-presets"
import { getLiveCrm, getProfileAccess } from "@/lib/crm/live"
import { requireSession } from "@/lib/crm/session"
import { signOut } from "../../actions"
import { removeAvatar, removeLogo, saveAccount, saveBrand, signOutEverywhere, uploadAvatar, uploadLogo } from "./actions"

export const metadata = { title: "הפרופיל שלי" }

export default async function AccountPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const session = await requireSession()
  const [data, access] = await Promise.all([getLiveCrm(tenant), getProfileAccess(tenant)])
  if (!data) notFound()

  return (
    <AccountView
      person={{
        email: session.email,
        fullName: session.fullName ?? "",
        jobTitle: session.jobTitle ?? "",
        phone: session.phone ?? "",
        avatarUrl: session.avatarUrl,
      }}
      business={{
        name: data.tenant.businessName,
        logoUrl: data.tenant.logoUrl ?? null,
        selectedPreset: matchPreset(data.pack.brand)?.id ?? null,
        industryPreset: data.pack.id,
        canEdit: access.canEdit,
      }}
      profileHref={`${data.basePath}/profile`}
      actions={{
        saveAccount,
        uploadAvatar,
        removeAvatar,
        uploadLogo: uploadLogo.bind(null, data.tenant.slug),
        removeLogo: removeLogo.bind(null, data.tenant.slug),
        saveBrand: saveBrand.bind(null, data.tenant.slug),
        signOut,
        signOutEverywhere,
      }}
    />
  )
}
