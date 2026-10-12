import type { Metadata } from "next"

import { ContractsAdmin } from "@/components/contracts/contracts-admin"
import { buildRows } from "@/lib/contracts/rows"
import { requireSuperAdmin } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "חוזים" }
export const dynamic = "force-dynamic"

export default async function ContractsAdminPage() {
  const session = await requireSuperAdmin()
  const supabase = await createClient()

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(
      "id, status, business_name, contact_name, email, phone, setup_fee_ils, monthly_fee_ils, agreement_version, created_at, expires_at, sent_at, viewed_at, signed_at, terms_accepted_at, privacy_accepted_at, otp_verified, signer_ip, agreement_sha256, pdf_sha256, token_enc",
    )
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw new Error("Could not load contracts")

  const { data: events } = await supabase.from("contract_events").select("contract_id, type, created_at").order("created_at", { ascending: true }).limit(2000)
  const rows = buildRows(contracts ?? [], events ?? [])

  return <ContractsAdmin email={session.email} rows={rows} />
}
