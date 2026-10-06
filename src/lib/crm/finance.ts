// The operator's own books: what the tools behind the product cost each month
// against what the clients pay. Pure (no I/O), so the same rules run in the
// page, in the server action's validation, and in unit tests.

export const EXPENSE_CATEGORIES = [
  { id: "ai", label: "בינה מלאכותית" },
  { id: "automation", label: "אוטומציות" },
  { id: "database", label: "בסיס נתונים" },
  { id: "hosting", label: "אחסון ואתר" },
  { id: "domain", label: "דומיין ודואר" },
  { id: "messaging", label: "הודעות ומיילים" },
  { id: "voice", label: "קול וטלפון" },
  { id: "tools", label: "כלים ותוכנות" },
  { id: "other", label: "אחר" },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["id"]
export type Currency = "ILS" | "USD"
export type Period = "monthly" | "yearly"

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, c.label])) as Record<ExpenseCategory, string>

export interface Expense {
  id: string
  name: string
  category: ExpenseCategory
  /** `null` = not entered yet. It is never counted as zero. */
  amount: number | null
  currency: Currency
  period: Period
  /** `null` = shared by every client. */
  tenantId: string | null
  url: string | null
  note: string | null
  active: boolean
}

export interface Client {
  id: string
  name: string
  slug: string
  /** What the client pays per month, in shekels. */
  plan: number
  archived: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** What an expense costs per month, in shekels; `null` while its amount is missing. */
export function monthlyShekels(expense: Pick<Expense, "amount" | "currency" | "period">, usdIls: number): number | null {
  if (expense.amount === null) return null
  const shekels = expense.currency === "USD" ? expense.amount * usdIls : expense.amount
  return expense.period === "yearly" ? shekels / 12 : shekels
}

export interface ClientRow {
  client: Client
  income: number
  /** Costs entered against this client alone. */
  direct: number
  /** Its equal share of the costs every client benefits from. */
  shared: number
  margin: number
  /** margin / income, or `null` for a client who pays nothing. */
  marginPct: number | null
}

export interface Summary {
  income: number
  expenses: number
  net: number
  marginPct: number | null
  /** Active expenses with no amount yet: listed, but not in any total. */
  missing: Expense[]
  byCategory: { id: ExpenseCategory; label: string; total: number }[]
  perClient: ClientRow[]
  activeClients: number
  payingClients: number
  /** How many clients at the average price it takes to cover the monthly costs. */
  breakEvenClients: number | null
}

/**
 * Totals for the month. A paused expense, and an archived client, stay on the
 * page but out of the arithmetic. A cost entered against a client that is
 * archived or gone counts as a shared cost, so what is split between the live
 * clients always adds up to the whole.
 */
export function summarize(expenses: Expense[], clients: Client[], usdIls: number): Summary {
  const live = clients.filter((c) => !c.archived)
  const liveIds = new Set(live.map((c) => c.id))
  const counted = expenses.filter((e) => e.active)

  const missing = counted.filter((e) => e.amount === null)
  const priced = counted.flatMap((e) => {
    const monthly = monthlyShekels(e, usdIls)
    return monthly === null ? [] : [{ expense: e, monthly }]
  })

  const directBy = new Map<string, number>()
  let shared = 0
  for (const { expense, monthly } of priced) {
    if (expense.tenantId && liveIds.has(expense.tenantId)) directBy.set(expense.tenantId, (directBy.get(expense.tenantId) ?? 0) + monthly)
    else shared += monthly
  }

  const total = priced.reduce((sum, p) => sum + p.monthly, 0)
  const income = live.reduce((sum, c) => sum + c.plan, 0)
  const share = live.length > 0 ? shared / live.length : 0

  const perClient: ClientRow[] = live.map((client) => {
    const direct = directBy.get(client.id) ?? 0
    const margin = client.plan - direct - share
    return { client, income: client.plan, direct: round2(direct), shared: round2(share), margin: round2(margin), marginPct: client.plan > 0 ? margin / client.plan : null }
  })

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    total: round2(priced.filter((p) => p.expense.category === c.id).reduce((sum, p) => sum + p.monthly, 0)),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const paying = live.filter((c) => c.plan > 0)
  const averagePlan = paying.length > 0 ? income / paying.length : 0

  return {
    income: round2(income),
    expenses: round2(total),
    net: round2(income - total),
    marginPct: income > 0 ? (income - total) / income : null,
    missing,
    byCategory,
    perClient,
    activeClients: live.length,
    payingClients: paying.length,
    breakEvenClients: total > 0 && averagePlan > 0 ? Math.ceil(total / averagePlan) : null,
  }
}

// ── input from the form ─────────────────────────────────────────────────────

export const FINANCE_LIMITS = { name: 80, note: 300, url: 300, amount: 10_000_000 } as const

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const clean = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "")

/** "1,200.50", "₪ 20", "$20" and "20" all mean what they look like; "" means "not entered". */
export function parseAmount(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 && raw <= FINANCE_LIMITS.amount ? round2(raw) : "invalid"
  if (typeof raw !== "string") return "invalid"
  const text = raw.replace(/[\s₪$]/g, "")
  if (text === "") return null
  // A comma is only a thousands separator ("1,200"). "19,90" is refused rather
  // than read as 1990: a silent hundredfold error in the books is worse than a prompt.
  if (!/^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(text)) return "invalid"
  const value = Number(text.replace(/,/g, ""))
  return value <= FINANCE_LIMITS.amount ? value : "invalid"
}

export interface ExpenseInput {
  name: string
  category: ExpenseCategory
  amount: number | null
  currency: Currency
  period: Period
  tenantId: string | null
  url: string | null
  note: string | null
}

export function validateExpense(input: unknown): { ok: true; value: ExpenseInput } | { ok: false; error: string } {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {}

  const name = clean(raw.name)
  if (name.length < 1 || name.length > FINANCE_LIMITS.name) return { ok: false, error: `כתבו שם לשירות (עד ${FINANCE_LIMITS.name} תווים)` }

  const category = EXPENSE_CATEGORIES.find((c) => c.id === raw.category)?.id
  if (!category) return { ok: false, error: "בחרו קטגוריה" }

  const amount = parseAmount(raw.amount)
  if (amount === "invalid") return { ok: false, error: "הסכום לא נראה תקין. כתבו מספר, למשל 49 או 19.90" }

  const currency: Currency | null = raw.currency === "USD" ? "USD" : raw.currency === "ILS" ? "ILS" : null
  if (!currency) return { ok: false, error: "בחרו מטבע" }

  const period: Period | null = raw.period === "yearly" ? "yearly" : raw.period === "monthly" ? "monthly" : null
  if (!period) return { ok: false, error: "בחרו כל כמה משלמים" }

  const tenantText = clean(raw.tenantId)
  if (tenantText && !UUID.test(tenantText)) return { ok: false, error: "הלקוח שנבחר לא קיים" }

  const urlText = clean(raw.url)
  let url: string | null = null
  if (urlText) {
    try {
      const parsed = new URL(urlText)
      if (parsed.protocol !== "https:" || urlText.length > FINANCE_LIMITS.url) throw new Error("not https")
      url = parsed.toString()
    } catch {
      return { ok: false, error: "הקישור חייב להתחיל ב-https://" }
    }
  }

  const note = clean(raw.note)
  if (note.length > FINANCE_LIMITS.note) return { ok: false, error: `ההערה ארוכה מדי (עד ${FINANCE_LIMITS.note} תווים)` }

  return { ok: true, value: { name, category, amount, currency, period, tenantId: tenantText || null, url, note: note || null } }
}

export function validateRate(raw: unknown): { ok: true; value: number } | { ok: false; error: string } {
  const text = typeof raw === "string" ? raw.replace(/\s/g, "") : typeof raw === "number" ? String(raw) : ""
  if (!/^\d{1,2}(\.\d{1,3})?$/.test(text)) return { ok: false, error: "כתבו את שער הדולר, למשל 3.65" }
  const value = Number(text)
  if (value < 1 || value > 20) return { ok: false, error: "השער חייב להיות בין 1 ל-20" }
  return { ok: true, value }
}

/** Services worth one tap: name, kind, currency and where to manage the plan. No amounts: those are yours. */
export const EXPENSE_SUGGESTIONS: { name: string; category: ExpenseCategory; currency: Currency; period: Period; url: string }[] = [
  { name: "Claude", category: "ai", currency: "USD", period: "monthly", url: "https://claude.ai/settings/billing" },
  { name: "n8n", category: "automation", currency: "ILS", period: "monthly", url: "https://app.n8n.cloud" },
  { name: "Supabase", category: "database", currency: "USD", period: "monthly", url: "https://supabase.com/dashboard/org/_/billing" },
  { name: "Vercel", category: "hosting", currency: "USD", period: "monthly", url: "https://vercel.com/ran-agency" },
  { name: "ElevenLabs", category: "voice", currency: "USD", period: "monthly", url: "https://elevenlabs.io/app/subscription" },
  { name: "Resend", category: "messaging", currency: "USD", period: "monthly", url: "https://resend.com/settings/billing" },
  { name: "WhatsApp Business (Meta)", category: "messaging", currency: "USD", period: "monthly", url: "https://business.facebook.com/billing_hub" },
  { name: "דומיין (MyNames)", category: "domain", currency: "ILS", period: "yearly", url: "https://www.mynames.co.il" },
]
