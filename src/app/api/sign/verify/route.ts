import { NextResponse, type NextRequest } from "next/server"

import { callerFrom } from "@/lib/contracts/request"
import { contractRpc, rateLimit } from "@/lib/contracts/rpc"
import { completeSigning, type VerifiedContract } from "@/lib/contracts/signing"
import { hashOtp, hashToken, isWellFormedToken } from "@/lib/contracts/token"

export const dynamic = "force-dynamic"

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })

/** The code entered: the signature becomes binding, the PDF is made and sent. */
export async function POST(request: NextRequest) {
  const caller = callerFrom(request.headers)
  let body: { token?: unknown; code?: unknown }
  try {
    body = await request.json()
  } catch {
    return fail(400, "bad_request")
  }
  const { token, code } = body
  if (typeof token !== "string" || !isWellFormedToken(token)) return fail(404, "invalid")
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return fail(400, "code_format")

  const tokenHash = hashToken(token)
  try {
    if (!(await rateLimit(`verify:ip:${caller.ip}`, 20, 600)) || !(await rateLimit(`verify:tok:${tokenHash}`, 20, 3600))) {
      return fail(429, "rate_limited")
    }

    let data = await contractRpc<{ ok: boolean; state?: string } & Partial<VerifiedContract>>("contract_verify_otp", {
      p_token_hash: tokenHash,
      p_code_hash: hashOtp(tokenHash, code),
      p_ip: caller.ip,
      p_ua: caller.userAgent,
    })
    if (!data.ok && data.state === "code_expired") {
      // A code that was accepted a moment ago but whose PDF step failed: finish that.
      data = await contractRpc("contract_resume_finalize", { p_token_hash: tokenHash })
    }
    if (!data.ok) return fail(data.state === "wrong_code" ? 400 : 409, data.state ?? "state")

    const finished = await completeSigning(tokenHash, data as VerifiedContract, caller)
    if (!finished) return fail(500, "finalize")
    return NextResponse.json({ ok: true, paymentUrl: process.env.GROW_PAYMENT_URL || null }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return fail(500, "server")
  }
}
