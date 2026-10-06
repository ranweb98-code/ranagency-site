"use server"

import { revalidatePath } from "next/cache"

import { validateExpense, validateRate } from "@/lib/crm/finance"
import { requireSuperAdmin } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"

type Result = { ok: true } | { ok: false; error: string }

const FAILED = "לא הצלחנו לשמור. נסו שוב."
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Only the super admin reaches any of this: the page redirects everyone else,
// and the tables answer to nobody but the super admin anyway (row level
// security), so a call that skips the page still changes nothing.

/** Adds an expense, or updates the one with this id. */
export async function saveExpense(id: string | null, input: unknown): Promise<Result> {
  await requireSuperAdmin()
  const checked = validateExpense(input)
  if (!checked.ok) return checked
  const { name, category, amount, currency, period, kind, spentOn, percent, tenantId, url, note } = checked.value
  const row = { name, category, amount, currency, period, kind, spent_on: spentOn, percent, tenant_id: tenantId, url, note }

  const supabase = await createClient()
  if (id === null) {
    const { error } = await supabase.from("admin_expenses").insert(row)
    if (error) return { ok: false, error: error.code === "23503" ? "הלקוח שנבחר לא קיים" : FAILED }
  } else {
    if (!UUID.test(id)) return { ok: false, error: "ההוצאה לא נמצאה" }
    const { data, error } = await supabase.from("admin_expenses").update(row).eq("id", id).select("id")
    if (error) return { ok: false, error: error.code === "23503" ? "הלקוח שנבחר לא קיים" : FAILED }
    if (!data?.length) return { ok: false, error: "ההוצאה לא נמצאה" }
  }

  revalidatePath("/app/admin/finance")
  return { ok: true }
}

/** Pause an expense (it stays listed but stops counting) or bring it back. */
export async function setExpenseActive(id: string, active: boolean): Promise<Result> {
  await requireSuperAdmin()
  if (!UUID.test(id)) return { ok: false, error: "ההוצאה לא נמצאה" }
  const supabase = await createClient()
  const { data, error } = await supabase.from("admin_expenses").update({ active }).eq("id", id).select("id")
  if (error || !data?.length) return { ok: false, error: FAILED }
  revalidatePath("/app/admin/finance")
  return { ok: true }
}

export async function deleteExpense(id: string): Promise<Result> {
  await requireSuperAdmin()
  if (!UUID.test(id)) return { ok: false, error: "ההוצאה לא נמצאה" }
  const supabase = await createClient()
  const { data, error } = await supabase.from("admin_expenses").delete().eq("id", id).select("id")
  if (error || !data?.length) return { ok: false, error: FAILED }
  revalidatePath("/app/admin/finance")
  return { ok: true }
}

export async function saveRate(input: unknown): Promise<Result> {
  await requireSuperAdmin()
  const checked = validateRate(input)
  if (!checked.ok) return checked
  const supabase = await createClient()
  const { data, error } = await supabase.from("admin_settings").update({ usd_ils: checked.value }).eq("id", true).select("id")
  if (error || !data?.length) return { ok: false, error: FAILED }
  revalidatePath("/app/admin/finance")
  return { ok: true }
}
