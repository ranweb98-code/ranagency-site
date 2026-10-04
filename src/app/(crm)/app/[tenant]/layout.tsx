import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { CrmShell } from "@/components/crm/shell/crm-shell"
import { getLiveCrm } from "@/lib/crm/live"
import { requireSession } from "@/lib/crm/session"
import { themeStyle } from "@/lib/crm/theme"
import { signOut } from "../actions"
import { createLead } from "./actions"

type Params = { params: Promise<{ tenant: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tenant } = await params
  const data = await getLiveCrm(tenant)
  return data ? { title: data.tenant.businessName } : {}
}

export default async function LiveTenantLayout({ children, params }: Params & { children: ReactNode }) {
  const { tenant } = await params
  const session = await requireSession()
  // Row level security answers "may this person see this business at all":
  // no membership means no row, which is a plain 404 (it doesn't confirm that
  // the business exists).
  const data = await getLiveCrm(tenant)
  if (!data) notFound()

  return (
    <div className="crm-root" style={themeStyle(data.pack.brand)}>
      <CrmShell
        base={data.basePath}
        account={{
          email: session.email,
          signOut,
          createLead: createLead.bind(null, data.tenant.slug),
          adminHref: session.isSuperAdmin ? "/app/admin" : undefined,
        }}
        businessName={data.tenant.businessName}
        ownerName={session.fullName ?? (data.tenant.ownerName || session.email)}
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
