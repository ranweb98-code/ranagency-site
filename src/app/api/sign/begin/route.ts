import { NextResponse, type NextRequest } from "next/server"

import { sendOtpEmail } from "@/lib/contracts/email"
import { callerFrom } from "@/lib/contracts/request"
import { contractRpc, rateLimit } from "@/lib/contracts/rpc"
import { hashOtp, hashToken, isWellFormedToken, newOtp } from "@/lib/contracts/token"

export const dynamic = "force-dynamic"

const MAX_SIGNATURE_BYTES = 250_000
const PNG_MAGIC = "89504e470d0a1a0a"

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })

/** "Sign" pressed: stores the consents, name and drawing (not yet binding) and
 *  emails a 6-digit code. */
export async function POST(request: NextRequest) {
  const caller = callerFrom(request.headers)
  let body: { token?: unknown; typedName?: unknown; terms?: unknown; privacy?: unknown; signature?: unknown }
  try {
    body = await request.json()
  } catch {
    return fail(400, "bad_request")
  }
  const { token, typedName, terms, privacy, signature } = body
  if (typeof token !== "string" || !isWellFormedToken(token)) return fail(404, "invalid")
  if (typeof typedName !== "string" || typedName.trim().length < 2 || typedName.length > 120) return fail(400, "name")
  if (terms !== true || privacy !== true) return fail(400, "consent")
  if (typeof signature !== "string" || !signature.startsWith("data:image/png;base64,")) return fail(400, "signature")

  const png = Buffer.from(signature.slice("data:image/png;base64,".length), "base64")
  if (png.length < 200 || png.length > MAX_SIGNATURE_BYTES || png.subarray(0, 8).toString("hex") !== PNG_MAGIC) return fail(400, "signature")

  const tokenHash = hashToken(token)
  try {
    if (!(await rateLimit(`begin:ip:${caller.ip}`, 10, 600)) || !(await rateLimit(`begin:tok:${tokenHash}`, 8, 3600))) {
      return fail(429, "rate_limited")
    }

    const code = newOtp()
    const result = await contractRpc<{ ok: boolean; state?: string; email?: string }>("contract_begin_sign", {
      p_token_hash: tokenHash,
      p_typed_name: typedName,
      p_terms: true,
      p_privacy: true,
      p_signature_hex: `\\x${png.toString("hex")}`,
      p_code_hash: hashOtp(tokenHash, code),
      p_ip: caller.ip,
      p_ua: caller.userAgent,
    })
    if (!result.ok || !result.email) return fail(result.state === "too_many_codes" ? 429 : 409, result.state ?? "state")

    if (!(await sendOtpEmail(result.email, code))) return fail(502, "email")
    const [name, domain] = result.email.split("@")
    return NextResponse.json({ ok: true, emailHint: `${name.slice(0, 2)}***@${domain}` }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return fail(500, "server")
  }
}
