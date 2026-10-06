import { redirect } from "next/navigation"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { AVATAR_PATH, publicStorageUrl } from "./storage-url"

export interface Session {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  jobTitle: string | null
  avatarUrl: string | null
  isSuperAdmin: boolean
}

/** Who is calling, from the verified JWT plus their profile row. `null` when
 *  signed out. Cached per request so layouts and pages share one lookup. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", claims.sub).maybeSingle()
  return {
    id: claims.sub,
    email: profile?.email ?? (typeof claims.email === "string" ? claims.email : ""),
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    jobTitle: profile?.job_title ?? null,
    avatarUrl: profile?.avatar_path && AVATAR_PATH.test(profile.avatar_path) ? (publicStorageUrl("avatars", profile.avatar_path) ?? null) : null,
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
