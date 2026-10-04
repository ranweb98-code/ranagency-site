import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { sessionCookieOptions } from "./cookies"
import type { Database } from "./database.types"
import { supabaseEnv } from "./env"

/** A Supabase client acting as the signed-in user (RLS applies), for Server
 *  Components, Route Handlers and Server Actions. */
export async function createClient() {
  const env = supabaseEnv()
  if (!env) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)")
  const store = await cookies()

  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, sessionCookieOptions(options))
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session on every /app request, so this is safe.
        }
      },
    },
  })
}
