import { ArrowUpLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PackIcon } from "@/components/crm/ui/icon-map"
import { resolvePack } from "@/lib/crm/live-mapper"
import { requireSession } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "./actions"

export const metadata = { title: "העסקים שלי" }

// Where a signed-in person lands: the super admin goes to the admin screen, a
// person with one business goes straight into it, several get a chooser, and
// someone who has not been invited yet is told exactly that.
export default async function AppHome() {
  const session = await requireSession()
  if (session.isSuperAdmin) redirect("/app/admin")

  const supabase = await createClient()
  // Picks up an invitation sent after this person's account already existed.
  await supabase.rpc("claim_my_invitations")

  const { data } = await supabase
    .from("memberships")
    .select("role, tenants(slug, business_name, industry, brand, archived_at)")
    .eq("user_id", session.id)

  const businesses = (data ?? []).flatMap((m) => (m.tenants && !m.tenants.archived_at ? [{ role: m.role, ...m.tenants }] : []))
  if (businesses.length === 1) redirect(`/app/${businesses[0].slug}`)

  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto grid min-h-dvh w-full max-w-lg content-center px-5 py-10">
        <p className="mb-5 text-center text-sm font-medium tracking-tight">נפוץ&apos; CRM</p>
        <div className="crm-panel rounded-[32px] p-6 md:p-8">
          {businesses.length === 0 ? (
            <>
              <h1 className="text-[26px] font-medium leading-tight tracking-tight">עוד לא חיברנו אתכם לעסק</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-crm-ink/70">
                נכנסתם בתור{" "}
                <bdi dir="ltr" className="font-medium text-crm-ink">
                  {session.email}
                </bdi>
                , אבל לכתובת הזו עדיין אין עסק במערכת. אם אתם לקוחות של נפוץ&apos;, כתבו לנו מאיזו כתובת מייל להזמין אתכם ונחבר אותה.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-medium leading-tight tracking-tight">לאיזה עסק להיכנס?</h1>
              <ul className="mt-5 space-y-2.5">
                {businesses.map((b) => {
                  const pack = resolvePack(b.industry, b.brand)
                  return (
                    <li key={b.slug}>
                      <Link
                        href={`/app/${b.slug}`}
                        className="group flex items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-3.5 transition-colors hover:bg-black/[0.09]"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: pack.brand.accent }}>
                          <PackIcon name={pack.catalogIcon} className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{b.business_name}</span>
                          <span className="block text-xs text-crm-muted">{pack.label}</span>
                        </span>
                        <ArrowUpLeft className="size-4" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-[13px] text-crm-ink/70 underline-offset-4 hover:underline">
              יציאה
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
