import Link from "next/link"
import type { ReactNode } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/env"

// Per-request, never prerendered: these pages depend on who is signed in, and a
// missing Supabase setting must not be able to fail the build of the marketing
// site and the demo that share this deployment.
export const dynamic = "force-dynamic"

// Everything under /app needs the database. If this deployment has no Supabase
// settings yet, say so plainly instead of failing on the first query.
export default function AppLayout({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) return children

  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto grid min-h-dvh w-full max-w-md content-center px-5 py-10">
        <div className="crm-panel rounded-[32px] p-6 md:p-8">
          <h1 className="text-[26px] font-medium leading-tight tracking-tight">הכניסה עדיין לא מחוברת</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-crm-ink/70">המערכת עוד לא הוגדרה בשרת הזה. אפשר בינתיים לראות את גרסת ההדגמה.</p>
          <Link href="/crm" className="mt-5 inline-block rounded-full bg-crm-ink px-6 py-3 text-sm font-medium text-white">
            לגרסת ההדגמה
          </Link>
        </div>
      </main>
    </div>
  )
}
