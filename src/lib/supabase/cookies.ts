import type { CookieOptions } from "@supabase/ssr"

// The session is only ever read on the server (there is no browser Supabase
// client), so its cookies can be invisible to page scripts: an XSS bug then
// cannot lift a login. `secure` keeps it off plain-http connections in production.
export function sessionCookieOptions(options: CookieOptions): CookieOptions {
  return { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production" }
}
