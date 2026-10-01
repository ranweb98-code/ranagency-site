import { ArrowUpLeft } from "lucide-react"
import Link from "next/link"

import { PackIcon } from "@/components/crm/ui/icon-map"
import { PACKS } from "@/lib/crm/industries"
import { listTenants } from "@/lib/crm/repository"
import type { WorkMode } from "@/lib/crm/types"

const MODE: Record<WorkMode, string> = {
  appointments: "מבוסס תורים",
  projects: "מבוסס פרויקטים",
  listings: "מבוסס קטלוג",
}

export const metadata = { title: "בחירת עסק להדגמה" }

export default function CrmDemoPicker() {
  const tenants = listTenants()
  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-5 py-12 md:py-20">
        <p className="text-xs text-crm-muted">נפוץ&apos; CRM · מצב הדגמה</p>
        <h1 className="mt-3 max-w-3xl text-[38px] font-medium leading-[1.05] tracking-tight md:text-[60px]">
          אותה מערכת. כל עסק מקבל אותה בשפה שלו.
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-crm-ink/65">
          המונחים, שלבי המכירה, השדות, הקטלוג והמיתוג משתנים לפי סוג העסק. בחרו עסק וראו איך אותו CRM מתאים את עצמו.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => {
            const pack = PACKS[tenant.industry]
            return (
              <li key={tenant.slug}>
                <Link
                  href={`/crm/${tenant.slug}`}
                  className="crm-glass group relative block overflow-hidden rounded-[30px] p-5 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"
                >
                  <div
                    aria-hidden
                    className="mb-5 flex h-24 items-end justify-between rounded-[22px] p-3"
                    style={{ backgroundImage: `linear-gradient(135deg, ${pack.brand.bgFrom}, ${pack.brand.bgTo})` }}
                  >
                    <span className="flex gap-1.5">
                      {[pack.brand.accent, pack.brand.accent2, pack.brand.warm, pack.brand.ink].map((color) => (
                        <span key={color} className="size-6 rounded-full ring-2 ring-white/80" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span className="grid size-10 place-items-center rounded-full bg-white/70">
                      <PackIcon name={pack.catalogIcon} className="size-5" />
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-medium">{pack.label}</h2>
                      <p className="mt-0.5 text-[13px] text-crm-muted">{tenant.businessName}</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.06] transition-colors group-hover:bg-crm-ink group-hover:text-white">
                      <ArrowUpLeft className="size-4" aria-hidden />
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                    {[MODE[pack.mode], `${pack.vocab.catalog}`, `${pack.stages.length} שלבים`].map((chip) => (
                      <li key={chip} className="rounded-full bg-black/[0.06] px-2.5 py-1">
                        {chip}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
