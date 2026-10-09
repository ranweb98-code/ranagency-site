"use server"

import { revalidatePath } from "next/cache"

import { CATALOG_LIMITS, validateCatalogItem } from "@/lib/crm/catalog-item"
import { readImage } from "@/lib/crm/read-image"
import { requireSession } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }
type SavedResult = { ok: true; id: string } | { ok: false; error: string }

const FAILED = "לא הצלחנו לשמור. נסו שוב."
const OWNERS_ONLY = "רק בעלי העסק יכולים לערוך את הקטלוג"

// Every write is guarded twice: here (a clear message) and by row level
// security on both the table and the storage bucket, which refuse anyone who is
// not an owner of this business, whatever this code does.

async function businessFor(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("tenants").select("id").eq("slug", slug).is("archived_at", null).maybeSingle()
  return { supabase, tenantId: data?.id }
}

async function photosOf(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string, itemId: string) {
  const { data } = await supabase.from("catalog_items").select("photos").eq("id", itemId).eq("tenant_id", tenantId).maybeSingle()
  return data?.photos
}

export async function saveCatalogItem(slug: string, itemId: string | null, input: unknown): Promise<SavedResult> {
  await requireSession()
  const checked = validateCatalogItem(input)
  if (!checked.ok) return checked
  const { title, subtitle, price, priceSuffix, tags, status } = checked.value

  const { supabase, tenantId } = await businessFor(slug)
  if (!tenantId) return { ok: false, error: "העסק לא נמצא" }

  if (itemId) {
    const { data, error } = await supabase
      .from("catalog_items")
      .update({ title, subtitle, price, price_suffix: priceSuffix, tags, status })
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .select("id")
    if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }
    revalidatePath(`/app/${slug}`, "layout")
    return { ok: true, id: itemId }
  }

  const { count } = await supabase.from("catalog_items").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId)
  if ((count ?? 0) >= CATALOG_LIMITS.items) return { ok: false, error: "הגעתם למספר הפריטים המקסימלי בקטלוג" }

  const { data, error } = await supabase
    .from("catalog_items")
    .insert({ tenant_id: tenantId, title, subtitle, price, price_suffix: priceSuffix, tags, status, position: count ?? 0 })
    .select("id")
    .single()
  if (error || !data) return { ok: false, error: error?.code === "42501" ? OWNERS_ONLY : FAILED }

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true, id: data.id }
}

export async function deleteCatalogItem(slug: string, itemId: string): Promise<Result> {
  await requireSession()
  const { supabase, tenantId } = await businessFor(slug)
  if (!tenantId) return { ok: false, error: "העסק לא נמצא" }

  const photos = (await photosOf(supabase, tenantId, itemId)) ?? []
  const { data, error } = await supabase.from("catalog_items").delete().eq("id", itemId).eq("tenant_id", tenantId).select("id")
  if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }

  if (photos.length) await supabase.storage.from("catalog").remove(photos)
  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

export async function addCatalogPhoto(slug: string, itemId: string, form: FormData): Promise<Result> {
  await requireSession()
  const image = await readImage(form)
  if (!image.ok) return image

  const { supabase, tenantId } = await businessFor(slug)
  if (!tenantId) return { ok: false, error: "העסק לא נמצא" }

  const photos = await photosOf(supabase, tenantId, itemId)
  if (!photos) return { ok: false, error: "הפריט לא נמצא" }
  if (photos.length >= CATALOG_LIMITS.photos) return { ok: false, error: `אפשר עד ${CATALOG_LIMITS.photos} תמונות לפריט` }

  // A new name every time, so a replaced picture never serves a stale cached one.
  const path = `${tenantId}/${itemId}-${Date.now()}.${image.kind.ext}`
  const upload = await supabase.storage.from("catalog").upload(path, image.bytes, { contentType: image.kind.mime, cacheControl: "31536000", upsert: false })
  if (upload.error) return { ok: false, error: OWNERS_ONLY }

  const { data, error } = await supabase.from("catalog_items").update({ photos: [...photos, path] }).eq("id", itemId).eq("tenant_id", tenantId).select("id")
  if (error || !data?.length) {
    await supabase.storage.from("catalog").remove([path])
    return { ok: false, error: FAILED }
  }

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

export async function removeCatalogPhoto(slug: string, itemId: string, path: string): Promise<Result> {
  await requireSession()
  const { supabase, tenantId } = await businessFor(slug)
  if (!tenantId) return { ok: false, error: "העסק לא נמצא" }

  const photos = await photosOf(supabase, tenantId, itemId)
  if (!photos?.includes(path)) return { ok: false, error: "התמונה לא נמצאה" }

  const { data, error } = await supabase
    .from("catalog_items")
    .update({ photos: photos.filter((p) => p !== path) })
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .select("id")
  if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }

  await supabase.storage.from("catalog").remove([path])
  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

/** The first photo is the cover the agent and the catalog lead with. */
export async function makeCoverPhoto(slug: string, itemId: string, path: string): Promise<Result> {
  await requireSession()
  const { supabase, tenantId } = await businessFor(slug)
  if (!tenantId) return { ok: false, error: "העסק לא נמצא" }

  const photos = await photosOf(supabase, tenantId, itemId)
  if (!photos?.includes(path)) return { ok: false, error: "התמונה לא נמצאה" }

  const { data, error } = await supabase
    .from("catalog_items")
    .update({ photos: [path, ...photos.filter((p) => p !== path)] })
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .select("id")
  if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}
