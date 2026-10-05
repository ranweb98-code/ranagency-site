"use server"

import { revalidatePath } from "next/cache"

import { formatMoney } from "@/lib/crm/format"
import { resolvePack } from "@/lib/crm/live-mapper"
import { normalizePhone } from "@/lib/crm/phone"
import { validateProfile } from "@/lib/crm/profile"
import { requireSession } from "@/lib/crm/session"
import type { Channel } from "@/lib/crm/types"
import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

const CHANNEL_BY_SOURCE: Record<string, Channel> = {
  וואטסאפ: "whatsapp",
  אינסטגרם: "instagram",
  טלפון: "voice",
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A lead typed in by the team: the walk-in, the call no agent took. Whether the
 *  caller may do this is decided by row level security on the insert. */
export async function createLead(slug: string, input: { name: string; phone: string; itemId: string; source: string }): Promise<Result> {
  await requireSession()

  const name = input.name.trim().replace(/\s+/g, " ")
  if (name.length < 2 || name.length > 80) return { ok: false, error: "כתבו שם (עד 80 תווים)" }
  const phone = normalizePhone(input.phone)
  if (!phone) return { ok: false, error: "מספר הטלפון לא נראה תקין" }
  const channel = CHANNEL_BY_SOURCE[input.source]
  if (!channel) return { ok: false, error: "בחרו מאיפה הגיע הליד" }

  const supabase = await createClient()
  const { data: tenant } = await supabase.from("tenants").select("id, industry, brand").eq("slug", slug).is("archived_at", null).maybeSingle()
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }
  const pack = resolvePack(tenant.industry, tenant.brand)

  let value = 0
  let itemId: string | null = null
  if (UUID.test(input.itemId)) {
    const { data: item } = await supabase.from("catalog_items").select("id, price, deal_value").eq("id", input.itemId).eq("tenant_id", tenant.id).maybeSingle()
    if (item) {
      itemId = item.id
      value = Math.round((item.deal_value ?? Number(item.price) * pack.valueFactor) * 100) / 100
    }
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      tenant_id: tenant.id,
      name,
      phone,
      channel,
      stage_id: pack.stages[0].id,
      item_id: itemId,
      value,
      handled_by: "human",
      summary: "נוסף ידנית על ידי הצוות",
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return { ok: false, error: "המספר הזה כבר קיים אצלכם" }
    if (error.code === "42501") return { ok: false, error: "אין לכם הרשאה להוסיף כאן" }
    return { ok: false, error: "לא הצלחנו לשמור. נסו שוב." }
  }

  await supabase.from("timeline_events").insert({ tenant_id: tenant.id, contact_id: contact.id, kind: "lead", text: "הליד נוסף ידנית על ידי הצוות" })

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

/** Moves a lead to another stage of the pipeline. Reaching the last stage is
 *  what closes the deal: that stamps `closed_at`, which is the moment its value
 *  starts counting as revenue; moving back out clears it. */
export async function moveStage(slug: string, contactId: string, stageId: string): Promise<Result> {
  await requireSession()
  if (!UUID.test(contactId)) return { ok: false, error: "הכרטיס לא נמצא" }

  const supabase = await createClient()
  const { data: tenant } = await supabase.from("tenants").select("id, industry, brand").eq("slug", slug).is("archived_at", null).maybeSingle()
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const pack = resolvePack(tenant.industry, tenant.brand)
  const stage = pack.stages.find((s) => s.id === stageId)
  if (!stage) return { ok: false, error: "השלב לא קיים" }
  const closing = stage.id === pack.stages[pack.stages.length - 1].id

  const { data: contact } = await supabase.from("contacts").select("id, value, stage_id, closed_at").eq("id", contactId).eq("tenant_id", tenant.id).maybeSingle()
  if (!contact) return { ok: false, error: "הכרטיס לא נמצא" }
  if (contact.stage_id === stage.id) return { ok: true }

  const { error } = await supabase
    .from("contacts")
    .update({ stage_id: stage.id, closed_at: closing ? (contact.closed_at ?? new Date().toISOString()) : null })
    .eq("id", contact.id)
    .eq("tenant_id", tenant.id)
  if (error) return { ok: false, error: error.code === "42501" ? "אין לכם הרשאה לשנות כאן" : "לא הצלחנו לשמור. נסו שוב." }

  await supabase.from("timeline_events").insert([
    { tenant_id: tenant.id, contact_id: contact.id, kind: "stage", text: `הועבר לשלב ״${stage.label}״` },
    ...(closing ? [{ tenant_id: tenant.id, contact_id: contact.id, kind: "money", text: `העסקה נסגרה · ${formatMoney(Number(contact.value))}` }] : []),
  ])

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

/** Saves the business profile (the details the agents are built from) together
 *  with the few identity fields that live on the business row. Owners and the
 *  super admin only: row level security refuses the update for anyone else, and
 *  an update that matches no row is reported rather than passed off as saved. */
export async function saveProfile(slug: string, input: unknown): Promise<Result> {
  await requireSession()
  const checked = validateProfile(input)
  if (!checked.ok) return checked
  const { identity, profile } = checked.value

  const supabase = await createClient()
  const { data: tenant } = await supabase.from("tenants").select("id, settings").eq("slug", slug).is("archived_at", null).maybeSingle()
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const current = typeof tenant.settings === "object" && tenant.settings !== null && !Array.isArray(tenant.settings) ? tenant.settings : {}
  const { data, error } = await supabase
    .from("tenants")
    .update({
      business_name: identity.businessName,
      owner_name: identity.ownerName || null,
      tagline: identity.tagline || null,
      city: identity.city || null,
      settings: { ...current, profile: profile as unknown as Json },
    })
    .eq("id", tenant.id)
    .select("id")

  if (error) {
    if (error.code === "42501") return { ok: false, error: "רק בעלי העסק יכולים לערוך את הפרופיל" }
    if (error.code === "23514") return { ok: false, error: "הפרופיל גדול מדי. קצרו חלק מהטקסטים." }
    return { ok: false, error: "לא הצלחנו לשמור. נסו שוב." }
  }
  if (!data || data.length === 0) return { ok: false, error: "רק בעלי העסק יכולים לערוך את הפרופיל" }

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}
