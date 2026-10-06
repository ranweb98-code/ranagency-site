import type { Json } from "@/lib/supabase/database.types"

/** The operator's own business. It is a workspace like any client's (its own
 *  leads, agents and catalog), but it is not a client: it pays nothing, and it
 *  takes no share of the costs in the finance page. Set by hand in
 *  `tenants.settings.internal`; saving the business profile keeps it. */
export function isInternal(settings: Json): boolean {
  return typeof settings === "object" && settings !== null && !Array.isArray(settings) && settings.internal === true
}
