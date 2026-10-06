import { requireSuperAdmin } from "@/lib/crm/session"
import { isInternal } from "@/lib/crm/tenant-flags"
import { createClient } from "@/lib/supabase/server"
import { AdminView } from "./admin-view"

export const metadata = { title: "ניהול" }

export default async function AdminPage() {
  const session = await requireSuperAdmin()
  const supabase = await createClient()

  const [tenants, memberships, profiles, invitations] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, slug, business_name, industry, city, agents, plan_monthly, created_at, archived_at, settings, contacts(count)")
      .order("created_at", { ascending: false }),
    supabase.from("memberships").select("tenant_id, user_id, role"),
    supabase.from("profiles").select("id, email"),
    supabase.from("invitations").select("id, tenant_id, email, role").is("accepted_at", null).order("created_at"),
  ])
  for (const result of [tenants, memberships, profiles, invitations]) if (result.error) throw new Error(`Admin query failed: ${result.error.message}`)

  return (
    <AdminView
      email={session.email}
      // `settings` can hold a long business profile: only the flag goes to the browser
      tenants={(tenants.data ?? []).map(({ settings, ...rest }) => ({ ...rest, internal: isInternal(settings) }))}
      memberships={memberships.data ?? []}
      profiles={profiles.data ?? []}
      invitations={invitations.data ?? []}
    />
  )
}
