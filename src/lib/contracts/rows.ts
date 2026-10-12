import "server-only"

import type { ContractRow } from "@/components/contracts/contracts-admin"
import { signingUrl } from "./email"
import { decryptToken } from "./token"

type Stored = Omit<ContractRow, "link" | "events"> & { token_enc: string }

/** Turns database rows into what the owner's screen shows: an expired link is
 *  shown as expired, and a usable link is decrypted only while it can still be used. */
export function buildRows(contracts: Stored[], events: { contract_id: string; type: string; created_at: string }[]): ContractRow[] {
  const byContract = new Map<string, { type: string; at: string }[]>()
  for (const event of events) byContract.set(event.contract_id, [...(byContract.get(event.contract_id) ?? []), { type: event.type, at: event.created_at }])

  const now = Date.now()
  return contracts.map(({ token_enc, ...row }) => {
    const live = row.status === "draft" || row.status === "sent" || row.status === "viewed"
    const expired = live && new Date(row.expires_at).getTime() <= now
    return {
      ...row,
      status: expired ? "expired" : row.status,
      link: live && !expired ? signingUrl(decryptToken(token_enc)) : null,
      events: byContract.get(row.id) ?? [],
    }
  })
}
