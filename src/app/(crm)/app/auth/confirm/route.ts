import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { safeNext } from "@/lib/crm/auth-redirect"
import { createClient } from "@/lib/supabase/server"

const TYPES: readonly EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"]

// The email template links here with a `token_hash`. Unlike the PKCE callback
// it needs no cookie from the browser that requested the link, so it works when
// the email is opened on a phone and the login was started on a laptop.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null
  const next = safeNext(request.nextUrl.searchParams.get("next"))
  const fail = NextResponse.redirect(new URL("/app/login?notice=expired", request.url), 303)
  if (!tokenHash || !type || !TYPES.includes(type)) return fail

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) return fail

  await supabase.rpc("claim_my_invitations")
  return NextResponse.redirect(new URL(next, request.url), 303)
}
