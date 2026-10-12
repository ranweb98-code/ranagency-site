import "server-only"

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

/** Links are unguessable (32 random bytes) and valid for 14 days. */
export const LINK_VALID_DAYS = 14

export function newToken(): string {
  return randomBytes(32).toString("base64url")
}

/** The token is only ever stored hashed, for lookup. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

function key(): Buffer {
  const raw = process.env.CONTRACT_TOKEN_KEY
  const buffer = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0)
  if (buffer.length !== 32) throw new Error("CONTRACT_TOKEN_KEY must be 32 random bytes, base64 encoded")
  return buffer
}

/** AES-256-GCM, so the owner can copy or re-send a link later without the
 *  token ever sitting in the database in the clear. */
export function encryptToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64")
}

export function decryptToken(stored: string): string {
  const raw = Buffer.from(stored, "base64")
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12))
  decipher.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")
}

export function rpcSecret(): string {
  const secret = process.env.CONTRACT_RPC_SECRET
  if (!secret || secret.length < 24) throw new Error("CONTRACT_RPC_SECRET is not set (min 24 characters)")
  return secret
}

/** A 6-digit code, and the keyed hash that is stored instead of it. */
export function newOtp(): string {
  return String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, "0")
}

export function hashOtp(tokenHash: string, code: string): string {
  return createHmac("sha256", rpcSecret()).update(`${tokenHash}:${code}`).digest("hex")
}

/** Short-lived download link for the owner: 60 seconds, bound to one contract. */
export function signDownload(contractId: string, expiresAt: number): string {
  return createHmac("sha256", rpcSecret()).update(`pdf:${contractId}:${expiresAt}`).digest("hex")
}

export function verifyDownload(contractId: string, expiresAt: number, signature: string): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  const expected = Buffer.from(signDownload(contractId, expiresAt))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
