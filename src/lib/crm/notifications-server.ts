import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { NOTIFICATION_KINDS, type NotificationFeed } from "./notifications"

const PAGE = 30

/** The signed-in person's feed for one business. If the table cannot be read
 *  (not created yet, a blip) the bell simply stays empty: a missing
 *  notification must never take the whole workspace down with it. */
export const loadNotifications = cache(async (slug: string): Promise<NotificationFeed> => {
  const empty: NotificationFeed = { items: [], seenAt: null }
  try {
    const supabase = await createClient()
    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).is("archived_at", null).maybeSingle()
    if (!tenant) return empty

    const { data: claims } = await supabase.auth.getClaims()
    const userId = claims?.claims?.sub
    const [rows, seen] = await Promise.all([
      supabase.from("notifications").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(PAGE),
      userId ? supabase.from("notification_seen").select("seen_at").eq("tenant_id", tenant.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
    ])
    if (rows.error) return empty

    return {
      seenAt: seen.data?.seen_at ?? null,
      items: rows.data.map((n) => ({
        id: n.id,
        kind: NOTIFICATION_KINDS.find((k) => k === n.kind) ?? "info",
        urgent: n.urgent,
        title: n.title,
        body: n.body ?? "",
        contactId: n.contact_id ?? undefined,
        at: n.created_at,
      })),
    }
  } catch {
    return empty
  }
})
