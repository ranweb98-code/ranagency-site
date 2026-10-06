// The operator's own books: what the tools behind the product cost each month
// against what the clients pay. Pure (no I/O), so the same rules run in the
// page, in the server action's validation, and in unit tests.

export const EXPENSE_CATEGORIES = [
  { id: "ai", label: "בינה מלאכותית" },
  { id: "automation", label: "אוטומציות" },
  { id: "database", label: "בסיס נתונים" },
  { id: "hosting", label: "אחסון ואתר" },
  { id: "domain", label: "דומיין ודואר" },
  { id: "messaging", label: "הודעות וסליקה" },
  { id: "voice", label: "קול וטלפון" },
  { id: "tools", label: "כלים ותוכנות" },
  { id: "other", label: "אחר" },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["id"]
export type Currency = "ILS" | "USD"
export type Period = "monthly" | "yearly"
/** A standing cost (a subscription, a fee) or a single purchase on one date. */
export type Kind = "recurring" | "once"

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, c.label])) as Record<ExpenseCategory, string>

export interface Expense {
  id: string
  name: string
  category: ExpenseCategory
  /** `null` = not entered yet. It is never counted as zero. */
  amount: number | null
  currency: Currency
  period: Period
  kind: Kind
  /** The day a one-off was spent, `YYYY-MM-DD`; always `null` for a standing cost. */
  spentOn: string | null
  /** A fee that is a share of what the clients pay (payment clearing); `null` for a plain price. */
  percent: number | null
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

/** What an expense costs per month, in shekels; `null` while its amount is missing.
 *  A one-off is its full price (it belongs to the month it was spent in). */
export function monthlyShekels(expense: Pick<Expense, "amount" | "currency" | "period"> & { kind?: Kind }, usdIls: number): number | null {
  if (expense.amount === null) return null
  const shekels = expense.currency === "USD" ? expense.amount * usdIls : expense.amount
  return expense.kind !== "once" && expense.period === "yearly" ? shekels / 12 : shekels
}

// ── months ──────────────────────────────────────────────────────────────────

/** `YYYY-MM` of a `YYYY-MM-DD` date. */
export const monthOf = (date: string): string => date.slice(0, 7)

/** The day before/after a `YYYY-MM-DD` date. */
export function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, date + delta)).toISOString().slice(0, 10)
}

export function shiftMonth(month: string, delta: number): string {
  const [year, number] = month.split("-").map(Number)
  const index = year * 12 + (number - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`
}

const MONTH_NAMES = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]
export const monthLabel = (month: string): string => `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`

/** What the page counts for one month: standing costs always, one-offs only
 *  when they were spent in that month. */
export function inMonth(expense: Expense, month: string): boolean {
  return expense.kind === "recurring" || (expense.spentOn !== null && monthOf(expense.spentOn) === month)
}

// ── the month's totals ──────────────────────────────────────────────────────

export interface ClientRow {
  client: Client
  income: number
  /** Costs entered against this client alone, plus any percentage fee on what it pays. */
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
  /** Of `expenses`: what was bought once in this month. */
  oneOff: number
  net: number
  marginPct: number | null
  /** Active standing costs with no price and no percentage yet: listed, but not in any total. */
  missing: Expense[]
  byCategory: { id: ExpenseCategory; label: string; total: number }[]
  perClient: ClientRow[]
  activeClients: number
  payingClients: number
  /** How many clients at the average price it takes to cover the standing costs. */
  breakEvenClients: number | null
}

/**
 * Totals for one month (`YYYY-MM`). A paused expense, and an archived client,
 * stay on the page but out of the arithmetic. A cost entered against a client
 * that is archived or gone counts as a shared cost, so what is split between
 * the live clients always adds up to the whole. A percentage fee is a share of
 * the clients' payments: of one client's when it is entered against them, of
 * all of them otherwise — and a client pays its own share, not an equal one.
 */
export function summarize(expenses: Expense[], clients: Client[], usdIls: number, month: string): Summary {
  const live = clients.filter((c) => !c.archived)
  const liveById = new Map(live.map((c) => [c.id, c]))
  const income = live.reduce((sum, c) => sum + c.plan, 0)
  const counted = expenses.filter((e) => e.active && inMonth(e, month))

  const missing = counted.filter((e) => e.kind === "recurring" && e.amount === null && e.percent === null)

  const directBy = new Map<string, number>()
  const addDirect = (id: string, value: number) => directBy.set(id, (directBy.get(id) ?? 0) + value)
  let shared = 0
  let standing = 0
  let oneOff = 0
  const categoryTotals = new Map<ExpenseCategory, number>()
  const count = (e: Expense, value: number) => {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + value)
    if (e.kind === "once") oneOff += value
    else standing += value
  }

  for (const e of counted) {
    const fixed = monthlyShekels(e, usdIls) ?? 0
    const owner = e.tenantId ? liveById.get(e.tenantId) : undefined

    if (fixed > 0) {
      if (owner) addDirect(owner.id, fixed)
      else shared += fixed
      count(e, fixed)
    }

    if (e.percent !== null && e.percent > 0) {
      const rate = e.percent / 100
      if (owner) {
        addDirect(owner.id, owner.plan * rate)
        count(e, owner.plan * rate)
      } else if (!e.tenantId) {
        for (const c of live) addDirect(c.id, c.plan * rate)
        count(e, income * rate)
      }
    }
  }

  const total = standing + oneOff
  const share = live.length > 0 ? shared / live.length : 0

  const perClient: ClientRow[] = live.map((client) => {
    const direct = directBy.get(client.id) ?? 0
    const margin = client.plan - direct - share
    return { client, income: client.plan, direct: round2(direct), shared: round2(share), margin: round2(margin), marginPct: client.plan > 0 ? margin / client.plan : null }
  })

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, total: round2(categoryTotals.get(c.id) ?? 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const paying = live.filter((c) => c.plan > 0)
  const averagePlan = paying.length > 0 ? income / paying.length : 0

  return {
    income: round2(income),
    expenses: round2(total),
    oneOff: round2(oneOff),
    net: round2(income - total),
    marginPct: income > 0 ? (income - total) / income : null,
    missing,
    byCategory,
    perClient,
    activeClients: live.length,
    payingClients: paying.length,
    breakEvenClients: standing > 0 && averagePlan > 0 ? Math.ceil(standing / averagePlan) : null,
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

/** A real calendar day, `YYYY-MM-DD`, in a sane range; `null` otherwise. */
export function parseDay(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [year, month, day] = raw.split("-").map(Number)
  if (year < 2020 || year > 2100) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? raw : null
}

/** "1.5", "1.5%" or "" (no percentage); anything outside 0–100 is invalid. */
export function parsePercent(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? round2(raw) : "invalid"
  if (typeof raw !== "string") return "invalid"
  const text = raw.replace(/[\s%]/g, "")
  if (text === "") return null
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return "invalid"
  const value = Number(text)
  return value <= 100 ? value : "invalid"
}

export interface ExpenseInput {
  name: string
  category: ExpenseCategory
  amount: number | null
  currency: Currency
  period: Period
  kind: Kind
  spentOn: string | null
  percent: number | null
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

  const kind: Kind = raw.kind === "once" ? "once" : "recurring"
  // A one-off has no period; it is stored as "monthly" and the date decides the month.
  const period: Period | null = kind === "once" ? "monthly" : raw.period === "yearly" ? "yearly" : raw.period === "monthly" ? "monthly" : null
  if (!period) return { ok: false, error: "בחרו כל כמה משלמים" }

  let spentOn: string | null = null
  if (kind === "once") {
    spentOn = parseDay(raw.spentOn)
    if (!spentOn) return { ok: false, error: "בחרו את התאריך שבו הוצאתם" }
    if (amount === null) return { ok: false, error: "כתבו כמה הוצאתם" }
  }

  let percent: number | null = null
  if (kind === "recurring") {
    const parsed = parsePercent(raw.percent)
    if (parsed === "invalid") return { ok: false, error: "האחוז חייב להיות בין 0 ל-100, למשל 1.5" }
    percent = parsed
  }

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

  return { ok: true, value: { name, category, amount, currency, period, kind, spentOn, percent, tenantId: tenantText || null, url, note: note || null } }
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
  { name: "Grow (סליקה והוראת קבע)", category: "messaging", currency: "ILS", period: "monthly", url: "https://grow.business" },
  { name: "ElevenLabs", category: "voice", currency: "USD", period: "monthly", url: "https://elevenlabs.io/app/subscription" },
  { name: "Resend", category: "messaging", currency: "USD", period: "monthly", url: "https://resend.com/settings/billing" },
  { name: "WhatsApp Business (Meta)", category: "messaging", currency: "USD", period: "monthly", url: "https://business.facebook.com/billing_hub" },
  { name: "דומיין (MyNames)", category: "domain", currency: "ILS", period: "yearly", url: "https://www.mynames.co.il" },
]
