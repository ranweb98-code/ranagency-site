import { cache } from "react"
import { connection } from "next/server"

import { generateCrmData } from "./demo-data"
import { DEMO_TENANTS } from "./industries"
import { computeMetrics } from "./metrics"
import type { CrmData, Tenant } from "./types"

// The one seam between the CRM screens and wherever the data lives. Today it
// is generated demo data; when the first client signs, these three functions
// are what get rewritten against Supabase (tenant resolved from the
// subdomain, rows filtered by RLS). Screens never import demo-data directly.

export function listTenants(): Tenant[] {
  return DEMO_TENANTS
}

export const getCrm = cache(async (slug: string): Promise<CrmData | null> => {
  // "now" must be the request's now, not the build's, or the demo would
  // freeze on the day it was deployed.
  await connection()
  const tenant = DEMO_TENANTS.find((t) => t.slug === slug)
  return tenant ? generateCrmData(tenant) : null
})

export async function getCrmWithMetrics(slug: string) {
  const data = await getCrm(slug)
  return data ? { data, metrics: computeMetrics(data) } : null
}
