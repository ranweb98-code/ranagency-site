import { NextResponse, type NextRequest } from "next/server"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { updateSession } from "@/lib/supabase/proxy"

// Runs for /app only. The /crm demo and the marketing site never touch auth,
// so they stay static and fast.
//
// This is a first gate (and the place the session cookie is refreshed); every
// page and action still asks the database, where row level security is the
// real enforcement.

const PUBLIC = (path: string) => path === "/app/login" || path.startsWith("/app/auth/")

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next()

  const { response, claims } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  const redirect = (to: string) => {
    const target = NextResponse.redirect(new URL(to, request.url), 303)
    // keep any refreshed session cookies on the redirect
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie)
    target.headers.set("Cache-Control", "private, no-store")
    return target
  }

  if (!claims && !PUBLIC(pathname)) {
    const next = pathname === "/app" ? "" : `?next=${encodeURIComponent(pathname + search)}`
    return redirect(`/app/login${next}`)
  }
  if (claims && pathname === "/app/login") return redirect("/app")

  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export const config = { matcher: ["/app/:path*"] }
