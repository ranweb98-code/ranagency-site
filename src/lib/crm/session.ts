import { redirect } from "next/navigation"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export interface Session {
  id: string
  email: string
  fullName: string | null
  isSuperAdmin: boolean
}

/** Who is calling, from the verified JWT plus their profile row. `null` when
 *  signed out. Cached per request so layouts and pages share one lookup. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  const { data: profile } = await supabase.from("profiles").select("email, full_name, is_super_admin").eq("id", claims.sub).maybeSingle()
  return {
    id: claims.sub,
    email: profile?.email ?? (typeof claims.email === "string" ? claims.email : ""),
    fullName: profile?.full_name ?? null,
    isSuperAdmin: profile?.is_super_admin === true,
  }
})

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect("/app/login")
  return session
}

export async function requireSuperAdmin(): Promise<Session> {
  const session = await requireSession()
  if (!session.isSuperAdmin) redirect("/app")
  return session
}
