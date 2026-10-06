import { normalizePhone } from "./phone"

// A person's own details: what the header menu and the account page edit. Pure,
// so the same rules run in the server action and in unit tests.

export const ACCOUNT_LIMITS = { fullName: 80, jobTitle: 60 } as const

export interface AccountValue {
  fullName: string
  jobTitle: string | null
  phone: string | null
}

const clean = (value: unknown): string => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "")

export function validateAccount(input: unknown): { ok: true; value: AccountValue } | { ok: false; error: string } {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {}

  const fullName = clean(raw.fullName)
  if (fullName.length < 2 || fullName.length > ACCOUNT_LIMITS.fullName) {
    return { ok: false, error: `כתבו את השם שלכם (2 עד ${ACCOUNT_LIMITS.fullName} תווים)` }
  }

  const jobTitle = clean(raw.jobTitle)
  if (jobTitle.length > ACCOUNT_LIMITS.jobTitle) {
    return { ok: false, error: `התפקיד ארוך מדי (עד ${ACCOUNT_LIMITS.jobTitle} תווים)` }
  }

  const phoneText = clean(raw.phone)
  const phone = phoneText ? normalizePhone(phoneText) : null
  if (phoneText && !phone) return { ok: false, error: "מספר הטלפון לא נראה תקין" }

  return { ok: true, value: { fullName, jobTitle: jobTitle || null, phone } }
}
