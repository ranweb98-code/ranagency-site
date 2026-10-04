import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { supabaseEnv } from "@/lib/supabase/env"
import { buildCrmData, type LiveRows } from "./live-mapper"
import { computeMetrics } from "./metrics"
import type { CrmData } from "./types"

// The real-business side of `repository.ts`: reads one tenant from Supabase as
// the signed-in user, so row level security decides whether it exists for them
// at all (no membership → no tenant row → null → 404). Never a service key.

const PAGE = 1000 // PostgREST's default max rows per request
const CAP = 5000 // per table; a busy tenant needs per-thread loading, not more of this
const DAY = 86_400_000

interface Result<T> {
  data: T[] | null
  error: { message: string } | null
}

async function fetchAll<T>(table: string, run: (from: number, to: number) => PromiseLike<Result<T>>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < CAP; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1)
    if (error) throw new Error(`Could not load ${table}: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return rows
}

const TENANT_COLUMNS =
  "id, slug, business_name, owner_name, industry, tagline, city, plan_monthly, agents, brand, settings, created_at, archived_at"

export const getLiveCrm = cache(async (slug: string): Promise<CrmData | null> => {
  const supabase = await createClient()

  const { data: tenant, error } = await supabase.from("tenants").select(TENANT_COLUMNS).eq("slug", slug).is("archived_at", null).maybeSingle()
  if (error) throw new Error(`Could not load the business: ${error.message}`)
  if (!tenant) return null

  const now = new Date()
  const since = new Date(now.getTime() - 60 * DAY).toISOString()
  const base = supabaseEnv()?.url ?? ""
  const id = tenant.id

  const [contacts, messages, timeline, appointments, catalog] = await Promise.all([
    fetchAll("contacts", (a, b) => supabase.from("contacts").select("*").eq("tenant_id", id).order("last_contact_at", { ascending: false }).range(a, b)),
    fetchAll("messages", (a, b) => supabase.from("messages").select("*").eq("tenant_id", id).order("at", { ascending: false }).range(a, b)),
    fetchAll("timeline", (a, b) => supabase.from("timeline_events").select("*").eq("tenant_id", id).order("at", { ascending: false }).range(a, b)),
    fetchAll("appointments", (a, b) => supabase.from("appointments").select("*").eq("tenant_id", id).gte("starts_at", since).order("starts_at").range(a, b)),
    fetchAll("catalog", (a, b) => supabase.from("catalog_items").select("*").eq("tenant_id", id).order("position").order("created_at").range(a, b)),
  ])

  const rows: LiveRows = { tenant, contacts, messages, timeline, appointments, catalog }
  return buildCrmData(rows, {
    now,
    // `photos` holds paths inside the public `catalog` bucket
    photoUrl: (path) => `${base}/storage/v1/object/public/catalog/${path.split("/").map(encodeURIComponent).join("/")}`,
  })
})

export async function getLiveCrmWithMetrics(slug: string) {
  const data = await getLiveCrm(slug)
  return data ? { data, metrics: computeMetrics(data) } : null
}
