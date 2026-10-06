"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { validateAccount } from "@/lib/crm/account"
import { presetById } from "@/lib/crm/brand-presets"
import { MAX_IMAGE_BYTES, sniffImage, type ImageKind } from "@/lib/crm/image"
import { logoPath } from "@/lib/crm/live-mapper"
import { requireSession } from "@/lib/crm/session"
import { AVATAR_PATH } from "@/lib/crm/storage-url"
import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

const FAILED = "לא הצלחנו לשמור. נסו שוב."
const BRAND_KEYS = ["accent", "accent2", "warm", "ink", "bgFrom", "bgTo"] as const

/** Judges the file by its bytes, not by what the browser says it is. */
async function readImage(form: FormData): Promise<{ ok: true; bytes: Uint8Array; kind: ImageKind } | { ok: false; error: string }> {
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "לא נבחרה תמונה" }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "התמונה גדולה מדי. נסו תמונה קטנה יותר." }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffImage(bytes)
  if (!kind) return { ok: false, error: "הקובץ לא נראה כמו תמונה (JPG, PNG או WebP)" }
  return { ok: true, bytes, kind }
}

function asObject(raw: Json | undefined): Record<string, Json | undefined> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw) ? { ...raw } : {}
}

// ── the person ──────────────────────────────────────────────────────────────

/** Name, job title and phone of the signed-in person. The row is theirs alone:
 *  row level security refuses any other id, so nobody can edit someone else here. */
export async function saveAccount(input: unknown): Promise<Result> {
  const session = await requireSession()
  const checked = validateAccount(input)
  if (!checked.ok) return checked
  const { fullName, jobTitle, phone } = checked.value

  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").update({ full_name: fullName, job_title: jobTitle, phone }).eq("id", session.id).select("id")
  if (error || !data?.length) return { ok: false, error: FAILED }

  revalidatePath("/app", "layout")
  return { ok: true }
}

export async function uploadAvatar(form: FormData): Promise<Result> {
  const session = await requireSession()
  const image = await readImage(form)
  if (!image.ok) return image

  const supabase = await createClient()
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", session.id).maybeSingle()

  // A new file name every time: the old picture stays cached for whoever still
  // has it open, and the address never serves a stale image.
  const path = `${session.id}/avatar-${Date.now()}.${image.kind.ext}`
  const upload = await supabase.storage.from("avatars").upload(path, image.bytes, { contentType: image.kind.mime, cacheControl: "31536000", upsert: false })
  if (upload.error) return { ok: false, error: "לא הצלחנו להעלות את התמונה. נסו שוב." }

  const { data, error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", session.id).select("id")
  if (error || !data?.length) {
    await supabase.storage.from("avatars").remove([path])
    return { ok: false, error: FAILED }
  }

  const old = before?.avatar_path
  if (old && old !== path && AVATAR_PATH.test(old)) await supabase.storage.from("avatars").remove([old])

  revalidatePath("/app", "layout")
  return { ok: true }
}

export async function removeAvatar(): Promise<Result> {
  const session = await requireSession()
  const supabase = await createClient()
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", session.id).maybeSingle()

  const { data, error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", session.id).select("id")
  if (error || !data?.length) return { ok: false, error: FAILED }

  if (before?.avatar_path && AVATAR_PATH.test(before.avatar_path)) await supabase.storage.from("avatars").remove([before.avatar_path])
  revalidatePath("/app", "layout")
  return { ok: true }
}

/** Ends every session of this account, on every device. */
export async function signOutEverywhere() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: "global" })
  redirect("/app/login?notice=signedout")
}

// ── the business (owners and the super admin) ───────────────────────────────
// Storage and the business row are both guarded by "is owner of this business",
// so a team member who calls these gets a refusal from the database itself.

async function businessFor(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("tenants").select("id, brand").eq("slug", slug).is("archived_at", null).maybeSingle()
  return { supabase, tenant: data }
}

const OWNERS_ONLY = "רק בעלי העסק יכולים לשנות את הלוגו והצבעים"

export async function uploadLogo(slug: string, form: FormData): Promise<Result> {
  await requireSession()
  const image = await readImage(form)
  if (!image.ok) return image

  const { supabase, tenant } = await businessFor(slug)
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const path = `${tenant.id}/logo-${Date.now()}.${image.kind.ext}`
  const upload = await supabase.storage.from("catalog").upload(path, image.bytes, { contentType: image.kind.mime, cacheControl: "31536000", upsert: false })
  if (upload.error) return { ok: false, error: OWNERS_ONLY }

  const { data, error } = await supabase
    .from("tenants")
    .update({ brand: { ...asObject(tenant.brand), logo: path } })
    .eq("id", tenant.id)
    .select("id")
  if (error || !data?.length) {
    await supabase.storage.from("catalog").remove([path])
    return { ok: false, error: error?.code === "23514" ? FAILED : OWNERS_ONLY }
  }

  const old = logoPath(tenant.id, tenant.brand)
  if (old && old !== path) await supabase.storage.from("catalog").remove([old])
  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

export async function removeLogo(slug: string): Promise<Result> {
  await requireSession()
  const { supabase, tenant } = await businessFor(slug)
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const brand = asObject(tenant.brand)
  delete brand.logo
  const { data, error } = await supabase.from("tenants").update({ brand }).eq("id", tenant.id).select("id")
  if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }

  const old = logoPath(tenant.id, tenant.brand)
  if (old) await supabase.storage.from("catalog").remove([old])
  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}

/** Applies one of the ready-made palettes. Stored as the six plain hex values. */
export async function saveBrand(slug: string, presetId: string): Promise<Result> {
  await requireSession()
  const preset = presetById(presetId)
  if (!preset) return { ok: false, error: "הצבעים האלה לא קיימים" }

  const { supabase, tenant } = await businessFor(slug)
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const brand = asObject(tenant.brand)
  for (const key of BRAND_KEYS) brand[key] = preset.brand[key]
  const { data, error } = await supabase.from("tenants").update({ brand }).eq("id", tenant.id).select("id")
  if (error || !data?.length) return { ok: false, error: OWNERS_ONLY }

  revalidatePath(`/app/${slug}`, "layout")
  return { ok: true }
}
