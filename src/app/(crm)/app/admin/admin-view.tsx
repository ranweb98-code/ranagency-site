import { ArrowUpLeft } from "lucide-react"
import Link from "next/link"

import { ChannelDot } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { Pill } from "@/components/crm/ui/pill"
import { PACKS } from "@/lib/crm/industries"
import type { Channel, IndustryId } from "@/lib/crm/types"
import { signOut } from "../actions"
import { revokeInvitation } from "./actions"
import { InviteForm, NewBusinessForm } from "./forms"
import { ManageBusiness } from "./manage-business"

const ROLE = { owner: "בעלים", staff: "צוות" } as const
const channelOf = (a: string): a is Channel => a === "whatsapp" || a === "instagram" || a === "voice"

export interface AdminTenant {
  id: string
  slug: string
  business_name: string
  industry: string
  city: string | null
  agents: string[]
  plan_monthly: number
  archived_at: string | null
  contacts: { count: number }[]
}

export interface AdminData {
  email: string
  tenants: AdminTenant[]
  memberships: { tenant_id: string; user_id: string; role: string }[]
  profiles: { id: string; email: string }[]
  invitations: { id: string; tenant_id: string; email: string; role: string }[]
}

/** The super admin's list of businesses, with who can sign in to each. */
export function AdminView({ email, tenants, memberships, profiles, invitations }: AdminData) {
  const people = new Map(profiles.map((p) => [p.id, p]))
  const industries = (Object.keys(PACKS) as IndustryId[]).map((id) => ({ id, label: PACKS[id].label }))

  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-crm-muted">נפוץ&apos; CRM · ניהול</p>
            <h1 className="mt-1 text-[34px] font-medium leading-tight tracking-tight md:text-[44px]">העסקים</h1>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Link href="/crm" className="rounded-full bg-white/80 px-4 py-2 font-medium transition-colors hover:bg-white">
              הדגמה
            </Link>
            <form action={signOut}>
              <button type="submit" title={email} className="rounded-full bg-white/80 px-4 py-2 font-medium transition-colors hover:bg-white">
                יציאה
              </button>
            </form>
          </div>
        </header>

        <Glass className="mt-6 p-5 md:p-6">
          <h2 className="mb-4 text-[17px] font-medium">עסק חדש</h2>
          <NewBusinessForm industries={industries} />
        </Glass>

        <ul className="mt-6 grid grid-cols-1 gap-4">
          {tenants.length === 0 ? (
            <li>
              <Glass className="p-6 text-center text-[14px] text-crm-ink/70">עוד אין עסקים. צרו את הראשון למעלה.</Glass>
            </li>
          ) : null}
          {tenants.map((t) => {
            const pack = PACKS[t.industry as IndustryId] ?? PACKS.generic
            const members = memberships.filter((m) => m.tenant_id === t.id)
            const pending = invitations.filter((i) => i.tenant_id === t.id)
            const leads = t.contacts[0]?.count ?? 0
            return (
              <li key={t.id}>
                <Glass className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[19px] font-medium">{t.business_name}</h2>
                      <p className="mt-0.5 text-[13px] text-crm-muted">
                        {pack.label}
                        {t.city ? ` · ${t.city}` : ""} · {leads} {pack.vocab.people}
                        {t.plan_monthly ? ` · ₪${t.plan_monthly.toLocaleString("he-IL")} לחודש` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {t.agents.filter(channelOf).map((a) => (
                          <ChannelDot key={a} channel={a} />
                        ))}
                        {t.archived_at ? <Pill tone="soft">בארכיון</Pill> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/app/${t.slug}/account`}
                        className="rounded-full bg-black/[0.06] px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.11]"
                      >
                        פרופיל ומיתוג
                      </Link>
                      <Link
                        href={`/app/${t.slug}`}
                        className="flex items-center gap-1.5 rounded-full bg-crm-ink px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                      >
                        פתיחת ה-CRM
                        <ArrowUpLeft className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-[13px] font-medium text-crm-ink/70">משתמשים</h3>
                      {members.length === 0 && pending.length === 0 ? <p className="text-[13px] text-crm-muted">עוד אין משתמשים.</p> : null}
                      <ul className="space-y-1.5">
                        {members.map((m) => {
                          const p = people.get(m.user_id)
                          return (
                            <li key={m.user_id} className="flex items-center justify-between gap-2 rounded-2xl bg-black/[0.045] px-3.5 py-2 text-[13px]">
                              <bdi dir="ltr" className="truncate">
                                {p?.email ?? m.user_id}
                              </bdi>
                              <Pill tone="ink">{ROLE[m.role as keyof typeof ROLE] ?? m.role}</Pill>
                            </li>
                          )
                        })}
                        {pending.map((i) => (
                          <li key={i.id} className="flex items-center justify-between gap-2 rounded-2xl border border-dashed border-black/20 px-3.5 py-2 text-[13px]">
                            <span className="min-w-0">
                              <bdi dir="ltr" className="block truncate">
                                {i.email}
                              </bdi>
                              <span className="text-[11px] text-crm-muted">הזמנה פתוחה · {ROLE[i.role as keyof typeof ROLE] ?? i.role}</span>
                            </span>
                            <form action={revokeInvitation}>
                              <input type="hidden" name="id" value={i.id} />
                              <button type="submit" className="text-[12px] text-crm-ink/70 underline-offset-4 hover:underline">
                                ביטול
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 text-[13px] font-medium text-crm-ink/70">הזמנת משתמש</h3>
                      <InviteForm tenantId={t.id} />
                    </div>
                  </div>

                  <ManageBusiness tenantId={t.id} slug={t.slug} name={t.business_name} leads={leads} archived={Boolean(t.archived_at)} />
                </Glass>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
