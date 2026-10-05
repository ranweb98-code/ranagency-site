import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { supabaseEnv } from "@/lib/supabase/env"
import { buildCrmData, type LiveRows } from "./live-mapper"
import { computeMetrics } from "./metrics"
import { getSession } from "./session"
import type { CrmData } from "./types"

// The real-business side of `repository.ts`: reads one tenant from Supabase as
// the signed-in user, so row level security decides whether it exists for them
// at all (no membership → no tenant row → null → 404). Never a service key.
//
// Speed notes, because every page here is a server round trip to the database:
// - Two sequential round trips at most: the tenant (its id filters everything
//   else), then every table at once.
// - Conversations (messages, timeline) are the heavy part and only the inbox and
//   a contact's card show them, so they are a separate load that other screens
//   never pay for — and when they are needed they run alongside the rest.

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

type Base = Omit<LiveRows, "messages" | "timeline"> & { now: Date }

// Shared by the loads below, so a page and its layout look the tenant up once.
const loadTenant = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("tenants").select(TENANT_COLUMNS).eq("slug", slug).is("archived_at", null).maybeSingle()
  if (error) throw new Error(`Could not load the business: ${error.message}`)
  return data
})

const loadBase = cache(async (slug: string): Promise<Base | null> => {
  const tenant = await loadTenant(slug)
  if (!tenant) return null

  const supabase = await createClient()
  const now = new Date()
  const since = new Date(now.getTime() - 60 * DAY).toISOString()
  const id = tenant.id

  const [contacts, appointments, catalog] = await Promise.all([
    fetchAll("contacts", (a, b) => supabase.from("contacts").select("*").eq("tenant_id", id).order("last_contact_at", { ascending: false }).range(a, b)),
    fetchAll("appointments", (a, b) => supabase.from("appointments").select("*").eq("tenant_id", id).gte("starts_at", since).order("starts_at").range(a, b)),
    fetchAll("catalog", (a, b) => supabase.from("catalog_items").select("*").eq("tenant_id", id).order("position").order("created_at").range(a, b)),
  ])
  return { tenant, contacts, appointments, catalog, now }
})

const loadThreads = cache(async (slug: string) => {
  const tenant = await loadTenant(slug)
  if (!tenant) return { messages: [], timeline: [] }

  const supabase = await createClient()
  const id = tenant.id
  const [messages, timeline] = await Promise.all([
    fetchAll("messages", (a, b) => supabase.from("messages").select("*").eq("tenant_id", id).order("at", { ascending: false }).range(a, b)),
    fetchAll("timeline", (a, b) => supabase.from("timeline_events").select("*").eq("tenant_id", id).order("at", { ascending: false }).range(a, b)),
  ])
  return { messages, timeline }
})

function assemble(base: Base, threads: { messages: LiveRows["messages"]; timeline: LiveRows["timeline"] }): CrmData {
  const publicUrl = supabaseEnv()?.url ?? ""
  return buildCrmData(
    { ...base, ...threads },
    {
      now: base.now,
      // `photos` holds paths inside the public `catalog` bucket
      photoUrl: (path) => `${publicUrl}/storage/v1/object/public/catalog/${path.split("/").map(encodeURIComponent).join("/")}`,
    },
  )
}

/** The workspace without conversations: every contact has an empty `messages`
 *  and `timeline`. Enough for the overview, pipeline, calendar, catalog,
 *  contacts list and agents screens. */
export const getLiveCrm = cache(async (slug: string): Promise<CrmData | null> => {
  const base = await loadBase(slug)
  return base ? assemble(base, { messages: [], timeline: [] }) : null
})

/** The workspace with every conversation and activity timeline — for the inbox
 *  and a contact's card, the only screens that show them. */
export const getLiveCrmWithThreads = cache(async (slug: string): Promise<CrmData | null> => {
  // both wait on the same cached tenant lookup, then run side by side
  const [base, threads] = await Promise.all([loadBase(slug), loadThreads(slug)])
  return base ? assemble(base, threads) : null
})

export async function getLiveCrmWithMetrics(slug: string) {
  const data = await getLiveCrm(slug)
  return data ? { data, metrics: computeMetrics(data) } : null
}

/** Whether the signed-in person may edit this business's profile: its owners and
 *  the super admin. (Row level security enforces the same on the update; this
 *  only decides whether the form is editable or read-only.) */
export const getProfileAccess = cache(async (slug: string): Promise<{ canEdit: boolean }> => {
  const [tenant, session] = await Promise.all([loadTenant(slug), getSession()])
  if (!tenant || !session) return { canEdit: false }
  if (session.isSuperAdmin) return { canEdit: true }

  const supabase = await createClient()
  const { data } = await supabase.from("memberships").select("role").eq("tenant_id", tenant.id).eq("user_id", session.id).maybeSingle()
  return { canEdit: data?.role === "owner" }
})
