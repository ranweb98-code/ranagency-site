import "server-only"

import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { fillPlaceholders, formatIls, parseDocument } from "./text"

export interface ContractTerms {
  business_name: string
  contact_name: string
  tax_id: string
  address: string
  setup_fee_ils: number
  monthly_fee_ils: number
}

export interface RenderedDocument {
  version: string
  text: string
  sha256: string
}

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex")

async function load(file: string): Promise<string> {
  return readFile(path.join(process.cwd(), "contracts", file), "utf8")
}

function renderDate(): string {
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeZone: "Asia/Jerusalem" }).format(new Date())
}

/** Reads the current wording from /contracts, fills in this client's details,
 *  and returns the text to freeze into the contract along with its hash. */
export async function renderAgreement(terms: ContractTerms): Promise<RenderedDocument> {
  const text = fillPlaceholders(await load("service-agreement.md"), {
    business_name: terms.business_name,
    contact_name: terms.contact_name,
    tax_id: terms.tax_id,
    address: terms.address,
    setup_fee: formatIls(terms.setup_fee_ils),
    monthly_fee: formatIls(terms.monthly_fee_ils),
    date: renderDate(),
  })
  const version = parseDocument(text).version
  if (!version) throw new Error("contracts/service-agreement.md has no version in its front matter")
  return { version, text, sha256: sha256(text) }
}

export async function renderPrivacy(): Promise<RenderedDocument> {
  const text = await load("privacy-policy.md")
  const version = parseDocument(text).version
  if (!version) throw new Error("contracts/privacy-policy.md has no version in its front matter")
  return { version, text, sha256: sha256(text) }
}
