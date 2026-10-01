import { cache } from "react"

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
  // Demo pages are prerendered and regenerated hourly (`revalidate` on the
  // tenant routes), so "now" is at most an hour old and the pages are served
  // from the CDN instead of a cold serverless function in another continent.
  // Real tenants will read live rows and become dynamic; this is the one place
  // that changes.
  const tenant = DEMO_TENANTS.find((t) => t.slug === slug)
  return tenant ? generateCrmData(tenant) : null
})

export async function getCrmWithMetrics(slug: string) {
  const data = await getCrm(slug)
  return data ? { data, metrics: computeMetrics(data) } : null
}
