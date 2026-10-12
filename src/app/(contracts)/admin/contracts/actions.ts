"use server"

import { revalidatePath } from "next/cache"

import { renderAgreement, renderPrivacy } from "@/lib/contracts/documents"
import { sendLinkEmail, signingUrl } from "@/lib/contracts/email"
import { decryptToken, encryptToken, hashToken, LINK_VALID_DAYS, newToken, signDownload } from "@/lib/contracts/token"
import { requireSuperAdmin } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"

export interface CreateState {
  error?: string
  created?: { id: string; link: string; email: string; contactName: string }
}

function text(form: FormData, key: string, max: number): string {
  const value = form.get(key)
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function amount(form: FormData, key: string): number | null {
  const value = Number(text(form, key, 12).replace(/,/g, ""))
  return Number.isInteger(value) && value >= 0 && value <= 1_000_000 ? value : null
}

export async function createContractAction(_prev: CreateState, form: FormData): Promise<CreateState> {
  const session = await requireSuperAdmin()
  const business_name = text(form, "business_name", 200)
  const contact_name = text(form, "contact_name", 200)
  const email = text(form, "email", 254).toLowerCase()
  const phone = text(form, "phone", 30)
  const tax_id = text(form, "tax_id", 30)
  const address = text(form, "address", 300)
  const setup_fee_ils = amount(form, "setup_fee")
  const monthly_fee_ils = amount(form, "monthly_fee")

  if (!business_name || !contact_name || !phone || !tax_id || !address) return { error: "חסרים פרטים. מלאו את כל השדות." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "כתובת המייל לא תקינה." }
  if (setup_fee_ils === null || monthly_fee_ils === null) return { error: "התעריף חייב להיות מספר שלם." }

  const [agreement, privacy] = await Promise.all([
    renderAgreement({ business_name, contact_name, tax_id, address, setup_fee_ils, monthly_fee_ils }),
    renderPrivacy(),
  ])

  const token = newToken()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      token_hash: hashToken(token),
      token_enc: encryptToken(token),
      business_name,
      contact_name,
      email,
      phone,
      tax_id,
      address,
      setup_fee_ils,
      monthly_fee_ils,
      agreement_version: agreement.version,
      agreement_sha256: agreement.sha256,
      agreement_snapshot: agreement.text,
      privacy_version: privacy.version,
      privacy_sha256: privacy.sha256,
      privacy_snapshot: privacy.text,
      expires_at: new Date(Date.now() + LINK_VALID_DAYS * 86_400_000).toISOString(),
      created_by: session.id,
    })
    .select("id")
    .single()
  if (error || !data) return { error: "לא הצלחנו ליצור את החוזה. נסו שוב." }

  await supabase.from("contract_events").insert({ contract_id: data.id, type: "created" })
  revalidatePath("/admin/contracts")
  return { created: { id: data.id, link: signingUrl(token), email, contactName: contact_name } }
}

export async function sendContractEmailAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("contracts").select("token_enc, email, contact_name, status, expires_at").eq("id", id).single()
  if (!data) return { ok: false, error: "החוזה לא נמצא." }
  if (data.status === "signed" || data.status === "revoked" || new Date(data.expires_at) <= new Date()) {
    return { ok: false, error: "אי אפשר לשלוח חוזה שנחתם, בוטל או פג תוקפו." }
  }

  if (!(await sendLinkEmail(data.email, data.contact_name, decryptToken(data.token_enc)))) return { ok: false, error: "שליחת המייל נכשלה." }

  await supabase
    .from("contracts")
    .update({ sent_at: new Date().toISOString(), ...(data.status === "draft" ? { status: "sent" } : {}) })
    .eq("id", id)
  await supabase.from("contract_events").insert({ contract_id: id, type: "sent" })
  revalidatePath("/admin/contracts")
  return { ok: true }
}

/** Marks a link as sent when it was passed on by WhatsApp or copied by hand. */
export async function markSentAction(id: string): Promise<void> {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("contracts").select("status").eq("id", id).single()
  if (data?.status !== "draft") return
  await supabase.from("contracts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id)
  await supabase.from("contract_events").insert({ contract_id: id, type: "sent" })
  revalidatePath("/admin/contracts")
}

export async function revokeContractAction(id: string): Promise<{ ok: boolean }> {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("contracts").select("status").eq("id", id).single()
  if (!data || data.status === "signed" || data.status === "revoked") return { ok: false }
  const { error } = await supabase.from("contracts").update({ status: "revoked" }).eq("id", id)
  if (error) return { ok: false }
  await supabase.from("contract_events").insert({ contract_id: id, type: "revoked" })
  revalidatePath("/admin/contracts")
  return { ok: true }
}

/** A download link that works for 60 seconds. */
export async function pdfDownloadLinkAction(id: string): Promise<string | null> {
  await requireSuperAdmin()
  const expires = Date.now() + 60_000
  return `/admin/contracts/${id}/pdf?exp=${expires}&sig=${signDownload(id, expires)}`
}
