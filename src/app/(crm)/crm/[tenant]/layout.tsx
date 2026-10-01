import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"

import { CrmShell } from "@/components/crm/shell/crm-shell"
import { getCrm, listTenants } from "@/lib/crm/repository"

type Params = { params: Promise<{ tenant: string }> }

export const revalidate = 3600

export function generateStaticParams() {
  return listTenants().map((t) => ({ tenant: t.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tenant } = await params
  const data = await getCrm(tenant)
  return data ? { title: data.tenant.businessName } : {}
}

export default async function TenantLayout({ children, params }: Params & { children: ReactNode }) {
  const { tenant } = await params
  const data = await getCrm(tenant)
  if (!data) notFound()

  const { brand } = data.pack
  // The only place a tenant's brand becomes CSS: every colour in the CRM reads
  // these variables, so a client's identity is data in their pack, not code.
  const theme = {
    "--crm-accent": brand.accent,
    "--crm-accent-2": brand.accent2,
    "--crm-warm": brand.warm,
    "--crm-ink": brand.ink,
    "--crm-bg-from": brand.bgFrom,
    "--crm-bg-to": brand.bgTo,
  } as CSSProperties

  return (
    <div className="crm-root" style={theme}>
      <CrmShell
        slug={data.tenant.slug}
        businessName={data.tenant.businessName}
        ownerName={data.tenant.ownerName}
        industryLabel={data.pack.label}
        peopleLabel={data.pack.vocab.people}
        catalogLabel={data.pack.vocab.catalog}
        itemOptions={data.catalog.map((c) => ({ id: c.id, title: c.title }))}
        unread={data.contacts.reduce((sum, c) => sum + c.unread, 0)}
        search={data.contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
      >
        {children}
      </CrmShell>
    </div>
  )
}
