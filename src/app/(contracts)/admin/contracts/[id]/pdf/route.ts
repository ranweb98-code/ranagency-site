import { NextResponse, type NextRequest } from "next/server"

import { verifyDownload } from "@/lib/contracts/token"
import { getSession } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Owner only (signed in as super admin) AND a 60-second signed link.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.isSuperAdmin) return new NextResponse("Not found", { status: 404 })

  const exp = Number(request.nextUrl.searchParams.get("exp"))
  const sig = request.nextUrl.searchParams.get("sig") ?? ""
  if (!/^[0-9a-f-]{36}$/.test(id) || !verifyDownload(id, exp, sig)) return new NextResponse("Link expired", { status: 410 })

  const supabase = await createClient()
  const [{ data: file }, { data: contract }] = await Promise.all([
    supabase.from("contract_files").select("pdf").eq("contract_id", id).single(),
    supabase.from("contracts").select("business_name").eq("id", id).single(),
  ])
  const hex = typeof file?.pdf === "string" ? file.pdf : ""
  if (!hex.startsWith("\\x")) return new NextResponse("Not found", { status: 404 })

  const bytes = Buffer.from(hex.slice(2), "hex")
  const name = (contract?.business_name ?? "contract").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60)
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract.pdf"; filename*=UTF-8''${encodeURIComponent(name)}.pdf`,
      "Cache-Control": "private, no-store",
    },
  })
}
