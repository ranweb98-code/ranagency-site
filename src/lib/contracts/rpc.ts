import "server-only"

import { createClient } from "@supabase/supabase-js"

import { supabaseEnv } from "@/lib/supabase/env"
import { rpcSecret } from "./token"

/** The visitor-facing side acts as `anon`: it can call nothing but the
 *  contract_* functions, and each one also demands the server secret. There is
 *  no service-role key anywhere. */
export async function contractRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const env = supabaseEnv()
  if (!env) throw new Error("Supabase is not configured")
  const client = createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.rpc(fn, { p_secret: rpcSecret(), ...args })
  if (error) throw new Error(`contract rpc ${fn} failed: ${error.code ?? ""}`) // never echo row data
  return data as T
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  return contractRpc<boolean>("contract_rate_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds })
}

export interface PublicContract {
  state: "invalid" | "expired" | "revoked" | "signed" | "viewed"
  business_name?: string
  contact_name?: string
  email?: string
  phone?: string
  tax_id?: string
  address?: string
  setup_fee_ils?: number
  monthly_fee_ils?: number
  agreement_version?: string
  agreement_snapshot?: string
  privacy_version?: string
  privacy_snapshot?: string
  signed_at?: string
  otp_pending?: boolean
}
