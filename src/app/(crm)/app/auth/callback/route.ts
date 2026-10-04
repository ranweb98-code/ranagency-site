import { NextResponse, type NextRequest } from "next/server"

import { safeNext } from "@/lib/crm/auth-redirect"
import { createClient } from "@/lib/supabase/server"

// The sign-in link (PKCE flow): swaps the one-time `code` for a session. It
// only works in the browser that asked for the link; /app/auth/confirm covers
// the link being opened somewhere else.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const next = safeNext(request.nextUrl.searchParams.get("next"))
  const fail = NextResponse.redirect(new URL("/app/login?notice=expired", request.url), 303)
  if (!code) return fail

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return fail

  await supabase.rpc("claim_my_invitations")
  return NextResponse.redirect(new URL(next, request.url), 303)
}
