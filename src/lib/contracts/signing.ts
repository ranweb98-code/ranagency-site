import "server-only"

import { createHash } from "node:crypto"

import { baseUrl, sendOwnerSignedEmail, sendSignedCopyEmail } from "./email"
import { buildSignedPdf } from "./pdf"
import { contractRpc, type PublicContract } from "./rpc"

export interface VerifiedContract {
  contract: PublicContract
  tax_id: string
  typed_name: string
  signed_at: string
  signature_b64: string
  contract_id: string
  signer_ip?: string
}

/** Builds the PDF, stores it, closes the contract, then sends the copies. The
 *  signature is already binding by now; if anything here fails it can be run
 *  again (the contract stays "viewed" with a verified code until it succeeds). */
export async function completeSigning(tokenHash: string, data: VerifiedContract, caller: { ip: string; userAgent: string }): Promise<boolean> {
  const { contract } = data
  const { bytes, sha256 } = await buildSignedPdf({
    agreementText: contract.agreement_snapshot ?? "",
    agreementSha256: createHash("sha256").update(contract.agreement_snapshot ?? "", "utf8").digest("hex"),
    agreementVersion: contract.agreement_version ?? "",
    businessName: contract.business_name ?? "",
    contactName: contract.contact_name ?? "",
    taxId: data.tax_id,
    typedName: data.typed_name,
    signedAtIso: data.signed_at,
    ip: data.signer_ip ?? caller.ip,
    signaturePng: Buffer.from(data.signature_b64, "base64"),
  })

  const done = await contractRpc<{ ok: boolean }>("contract_finalize", {
    p_token_hash: tokenHash,
    p_pdf_hex: `\\x${bytes.toString("hex")}`,
    p_pdf_sha256: sha256,
    p_ip: caller.ip,
    p_ua: caller.userAgent,
  })
  if (!done.ok) return false

  // The agreement is signed; a failed email must not undo or hide that.
  await Promise.allSettled([
    sendSignedCopyEmail(contract.email ?? "", contract.contact_name ?? "", bytes),
    sendOwnerSignedEmail({
      businessName: contract.business_name ?? "",
      contactName: contract.contact_name ?? "",
      adminUrl: `${baseUrl()}/admin/contracts`,
      pdf: bytes,
    }),
  ])
  return true
}
