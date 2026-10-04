"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { sendInviteEmail } from "@/lib/crm/invite-email"
import { PACKS } from "@/lib/crm/industries"
import { requireSuperAdmin } from "@/lib/crm/session"
import type { Channel, IndustryId } from "@/lib/crm/types"
import { createClient } from "@/lib/supabase/server"

export interface AdminState {
  ok: boolean
  message?: string
  error?: string
  /** Shown when the email could not be sent, so the link can be passed on by hand. */
  loginUrl?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SLUG = /^[a-z0-9][a-z0-9-]{2,39}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CHANNELS: readonly Channel[] = ["whatsapp", "instagram", "voice"]

const text = (formData: FormData, key: string, max: number) => String(formData.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max)

async function loginUrl(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "napuch.co.il"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}/app/login`
}

async function notify(email: string, businessName: string, role: "owner" | "staff"): Promise<Pick<AdminState, "message" | "loginUrl">> {
  const url = await loginUrl()
  const sent = await sendInviteEmail({ to: email, businessName, role, loginUrl: url })
  return sent
    ? { message: `ההזמנה נשלחה אל ${email}` }
    : { message: `ההזמנה נשמרה, אבל המייל לא נשלח. שלחו ל-${email} את הקישור הזה:`, loginUrl: url }
}

export async function createBusiness(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireSuperAdmin()

  const businessName = text(formData, "business_name", 80)
  const slug = text(formData, "slug", 40).toLowerCase()
  const industry = text(formData, "industry", 20)
  const ownerEmail = text(formData, "owner_email", 254).toLowerCase()
  const ownerName = text(formData, "owner_name", 80)
  const city = text(formData, "city", 60)
  const tagline = text(formData, "tagline", 120)
  const plan = Math.round(Number(formData.get("plan_monthly") ?? 0))
  const agents = formData.getAll("agents").map(String).filter((a): a is Channel => (CHANNELS as readonly string[]).includes(a))

  if (businessName.length < 2) return { ok: false, error: "כתבו את שם העסק" }
  if (!SLUG.test(slug)) return { ok: false, error: "הכתובת: 3–40 תווים, אותיות קטנות באנגלית, ספרות ומקף" }
  if (!(industry in PACKS)) return { ok: false, error: "בחרו תחום" }
  if (!EMAIL.test(ownerEmail)) return { ok: false, error: "כתבו מייל תקין לבעל העסק" }
  if (!Number.isFinite(plan) || plan < 0 || plan > 100_000) return { ok: false, error: "מחיר חודשי לא תקין" }

  const supabase = await createClient()
  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      slug,
      business_name: businessName,
      industry: industry as IndustryId,
      owner_name: ownerName || null,
      city: city || null,
      tagline: tagline || null,
      plan_monthly: plan,
      agents,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return { ok: false, error: "הכתובת הזו תפוסה. בחרו אחרת." }
    return { ok: false, error: "לא הצלחנו ליצור את העסק. נסו שוב." }
  }

  const { error: inviteError } = await supabase.from("invitations").insert({ tenant_id: tenant.id, email: ownerEmail, role: "owner", invited_by: admin.id })
  revalidatePath("/app/admin")
  if (inviteError) return { ok: true, message: "העסק נוצר, אבל ההזמנה לבעל העסק לא נשמרה. הזמינו אותו מהכרטיס של העסק." }

  const note = await notify(ownerEmail, businessName, "owner")
  return { ok: true, ...note, message: `העסק ״${businessName}״ נוצר. ${note.message}` }
}

export async function inviteUser(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireSuperAdmin()

  const tenantId = text(formData, "tenant_id", 40)
  const email = text(formData, "email", 254).toLowerCase()
  const role = text(formData, "role", 10)
  if (!UUID.test(tenantId)) return { ok: false, error: "העסק לא נמצא" }
  if (!EMAIL.test(email)) return { ok: false, error: "כתבו מייל תקין" }
  if (role !== "owner" && role !== "staff") return { ok: false, error: "בחרו תפקיד" }

  const supabase = await createClient()
  const { data: tenant } = await supabase.from("tenants").select("business_name").eq("id", tenantId).maybeSingle()
  if (!tenant) return { ok: false, error: "העסק לא נמצא" }

  const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()
  if (profile) {
    const { data: member } = await supabase.from("memberships").select("user_id").eq("tenant_id", tenantId).eq("user_id", profile.id).maybeSingle()
    if (member) return { ok: false, error: "המשתמש הזה כבר חבר בעסק" }
  }

  const { error } = await supabase.from("invitations").insert({ tenant_id: tenantId, email, role, invited_by: admin.id })
  if (error) {
    if (error.code === "23505") return { ok: false, error: "כבר יש הזמנה פתוחה לכתובת הזו" }
    return { ok: false, error: "לא הצלחנו לשמור את ההזמנה. נסו שוב." }
  }

  revalidatePath("/app/admin")
  const note = await notify(email, tenant.business_name, role)
  return { ok: true, ...note }
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const id = text(formData, "id", 40)
  if (!UUID.test(id)) return
  const supabase = await createClient()
  await supabase.from("invitations").delete().eq("id", id).is("accepted_at", null)
  revalidatePath("/app/admin")
}
