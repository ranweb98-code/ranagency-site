"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { safeNext } from "@/lib/crm/auth-redirect"
import { createClient } from "@/lib/supabase/server"

export interface LoginState {
  step: "email" | "code"
  email: string
  error?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254)
}

async function siteOrigin(): Promise<string | null> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return null
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

/** Step 1: email a sign-in link (and code). Only invited addresses end up with
 *  access; anyone else who types an address gets an account with no business
 *  attached, which can read nothing. */
async function send(formData: FormData): Promise<LoginState> {
  const email = readEmail(formData)
  const next = safeNext(String(formData.get("next") ?? ""))
  if (!EMAIL.test(email)) return { step: "email", email, error: "כתבו כתובת מייל תקינה" }

  const origin = await siteOrigin()
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: origin ? `${origin}/app/auth/callback?next=${encodeURIComponent(next)}` : undefined,
    },
  })

  if (error) {
    const limited = error.status === 429 || /rate limit|security purposes/i.test(error.message)
    return {
      step: "email",
      email,
      error: limited ? "נשלחו כמה בקשות ברצף. חכו דקה ונסו שוב." : "לא הצלחנו לשלוח קישור כרגע. נסו שוב בעוד רגע.",
    }
  }
  return { step: "code", email }
}

/** Step 2 (optional): type the code from the same email — useful when the link
 *  is opened on another device. */
async function verify(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = readEmail(formData) || prev.email
  const token = String(formData.get("token") ?? "").replace(/\s/g, "")
  const next = safeNext(String(formData.get("next") ?? ""))
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "הקוד הוא ספרות בלבד, כמו שמופיע במייל" }

  const supabase = await createClient()
  // A first-time address is verified as a sign-up, a returning one as a login.
  let { error } = await supabase.auth.verifyOtp({ email, token, type: "email" })
  if (error) ({ error } = await supabase.auth.verifyOtp({ email, token, type: "signup" }))
  if (error) return { step: "code", email, error: "הקוד שגוי או שפג תוקפו. אפשר לבקש קישור חדש." }

  await supabase.rpc("claim_my_invitations")
  redirect(next)
}

/** One action for the whole form (`intent` says which button was pressed), so
 *  the screen is a single state machine: email → code → signed in. */
export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = String(formData.get("intent") ?? "send")
  if (intent === "change") return { step: "email", email: prev.email }
  if (intent === "verify") return verify(prev, formData)
  return send(formData)
}
