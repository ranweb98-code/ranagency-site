import Link from "next/link"

import { safeNext } from "@/lib/crm/auth-redirect"
import { LoginForm } from "./login-form"

export const metadata = { title: "כניסה" }

const NOTICES: Record<string, string> = {
  expired: "הקישור פג תוקף או כבר נוצל. בקשו קישור חדש.",
  signedout: "יצאתם מהמערכת.",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const { next, notice } = await searchParams

  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto grid min-h-dvh w-full max-w-md content-center px-5 py-10">
        <p className="mb-5 text-center text-sm font-medium tracking-tight">נפוץ&apos; CRM</p>
        <div className="crm-panel rounded-[32px] p-6 md:p-8">
          <LoginForm next={safeNext(next)} notice={notice ? NOTICES[notice] : undefined} />
        </div>
        <p className="mt-5 text-center text-[13px] text-crm-ink/60">
          רוצים לראות איך זה נראה?{" "}
          <Link href="/crm" className="font-medium text-crm-ink underline-offset-4 hover:underline">
            לגרסת ההדגמה
          </Link>
        </p>
      </main>
    </div>
  )
}
