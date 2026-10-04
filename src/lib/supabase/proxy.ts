import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { sessionCookieOptions } from "./cookies"
import type { Database } from "./database.types"
import { supabaseEnv } from "./env"

/** Refreshes the auth cookies for this request and reports who is calling.
 *  `claims` is verified against the project's signing keys, not just decoded. */
export async function updateSession(request: NextRequest) {
  const env = supabaseEnv()
  let response = NextResponse.next({ request })
  if (!env) return { response, claims: null }

  const supabase = createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, sessionCookieOptions(options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  return { response, claims: data?.claims ?? null }
}
