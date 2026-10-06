"use client"

import { ArrowRight, ArrowUpLeft, ChevronLeft, ChevronRight, Pause, Pencil, Play, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent, type ReactNode } from "react"

import { ToastProvider, useToast } from "@/components/crm/shell/toast"
import { fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { Glass } from "@/components/crm/ui/glass"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Modal } from "@/components/crm/ui/modal"
import { Pill } from "@/components/crm/ui/pill"
import { Segmented } from "@/components/crm/ui/segmented"
import { Select } from "@/components/crm/ui/select"
import { formatMoney } from "@/lib/crm/format"
import {
  CATEGORY_LABEL,
  EXPENSE_CATEGORIES,
  EXPENSE_SUGGESTIONS,
  FINANCE_LIMITS,
  inMonth,
  monthLabel,
  monthOf,
  monthlyShekels,
  shiftDay,
  shiftMonth,
  summarize,
  type Client,
  type Currency,
  type Expense,
  type ExpenseCategory,
  type Kind,
  type Period,
} from "@/lib/crm/finance"
import { cn } from "@/lib/utils"

type Result = { ok: true } | { ok: false; error: string }

export interface FinanceActions {
  saveExpense: (id: string | null, input: unknown) => Promise<Result>
  setExpenseActive: (id: string, active: boolean) => Promise<Result>
  deleteExpense: (id: string) => Promise<Result>
  saveRate: (input: unknown) => Promise<Result>
}

const NBSP = " "
const secondary =
  "flex items-center justify-center gap-2 rounded-full bg-black/[0.06] px-5 py-3 text-[14px] font-medium text-crm-ink transition-colors hover:bg-black/[0.11] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink disabled:opacity-60"
const NEGATIVE = "text-[#b3261e]"

const shekels = (n: number) => `${new Intl.NumberFormat("he-IL", { maximumFractionDigits: n < 100 ? 2 : 0 }).format(n)}${NBSP}₪`
const money = (amount: number, currency: Currency) =>
  currency === "USD"
    ? `$${new Intl.NumberFormat("en-US", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount)}`
    : shekels(amount)
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`
const dayLabel = (day: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "UTC", weekday: "short", day: "numeric", month: "numeric" }).format(new Date(`${day}T00:00:00Z`))

interface Draft {
  id: string | null
  kind: Kind
  name: string
  category: ExpenseCategory
  amount: string
  percent: string
  currency: Currency
  period: Period
  spentOn: string
  tenantId: string
  url: string
  note: string
}

const blank: Draft = { id: null, kind: "recurring", name: "", category: "tools", amount: "", percent: "", currency: "ILS", period: "monthly", spentOn: "", tenantId: "", url: "", note: "" }

const draftOf = (e: Expense): Draft => ({
  id: e.id,
  kind: e.kind,
  name: e.name,
  category: e.category,
  amount: e.amount === null ? "" : String(e.amount),
  percent: e.percent === null ? "" : String(e.percent),
  currency: e.currency,
  period: e.period,
  spentOn: e.spentOn ?? "",
  tenantId: e.tenantId ?? "",
  url: e.url ?? "",
  note: e.note ?? "",
})

export function FinanceView(props: { expenses: Expense[]; clients: Client[]; usdIls: number; today: string; actions: FinanceActions }) {
  return (
    <ToastProvider>
      <Books {...props} />
    </ToastProvider>
  )
}

function Books({ expenses, clients, usdIls, today, actions }: { expenses: Expense[]; clients: Client[]; usdIls: number; today: string; actions: FinanceActions }) {
  const router = useRouter()
  const toast = useToast()
  const thisMonth = monthOf(today)
  const [month, setMonth] = useState(thisMonth)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [busy, startBusy] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const summary = summarize(expenses, clients, usdIls, month)
  const clientName = new Map(clients.map((c) => [c.id, c.name]))
  const taken = new Set(expenses.map((e) => e.name.trim().toLowerCase()))
  const suggestions = EXPENSE_SUGGESTIONS.filter((s) => !taken.has(s.name.toLowerCase()))
  const standing = expenses.filter((e) => e.kind === "recurring")
  const oneOffs = expenses.filter((e) => e.kind === "once" && inMonth(e, month)).sort((a, b) => (b.spentOn ?? "").localeCompare(a.spentOn ?? ""))
  const net = summary.net
  const label = monthLabel(month)

  const run = (task: () => Promise<Result>, done: string) => {
    setError(null)
    startBusy(async () => {
      try {
        const result = await task()
        if (!result.ok) {
          setError(result.error)
          return
        }
        toast(done)
        router.refresh()
      } catch {
        setError("אין חיבור כרגע. נסו שוב.")
      }
    })
  }

  const newOneOff = () => setDraft({ ...blank, kind: "once", spentOn: monthOf(today) === month ? today : `${month}-01` })

  return (
    <div className="crm-root">
      <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/app/admin" className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-white">
              <ArrowRight className="size-3.5" aria-hidden />
              כל העסקים
            </Link>
            <p className="text-xs text-crm-muted">נפוץ&apos; CRM · ניהול</p>
            <h1 className="mt-1 text-[34px] font-medium leading-tight tracking-tight md:text-[44px]">הכספים שלי</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={newOneOff} className={cn(primaryButtonClass, "py-3")}>
              <Plus className="size-4" aria-hidden />
              הוצאה חד־פעמית
            </button>
            <button type="button" onClick={() => setDraft(blank)} className={secondary}>
              <Plus className="size-4" aria-hidden />
              מנוי / הוצאה קבועה
            </button>
          </div>
        </header>

        {/* ── which month ───────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/80 p-1">
            <IconButton label="החודש הקודם" size="sm" tone="glass" onClick={() => setMonth(shiftMonth(month, -1))}>
              <ChevronRight />
            </IconButton>
            <span aria-live="polite" className="min-w-32 text-center text-[14px] font-medium">
              {label}
            </span>
            <IconButton label="החודש הבא" size="sm" tone="glass" onClick={() => setMonth(shiftMonth(month, 1))}>
              <ChevronLeft />
            </IconButton>
          </div>
          {month !== thisMonth ? (
            <button type="button" onClick={() => setMonth(thisMonth)} className="rounded-full bg-white/80 px-4 py-2 text-[12px] font-medium transition-colors hover:bg-white">
              חזרה לחודש הנוכחי
            </button>
          ) : null}
        </div>
        {month !== thisMonth ? <p className="mt-2 px-1 text-[12px] text-crm-muted">ההכנסה והעלויות הקבועות מחושבות לפי המחירים של היום. רק ההוצאות החד־פעמיות שייכות לחודש הזה.</p> : null}

        {/* ── the month at a glance ─────────────────────────────── */}
        <section aria-label="סיכום חודשי" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Kpi label="נכנס מלקוחות" value={formatMoney(summary.income)} sub={`${summary.payingClients} לקוחות משלמים`} />
          <Kpi
            label="יוצא"
            value={formatMoney(summary.expenses)}
            sub={summary.oneOff > 0 ? `מתוכם חד־פעמי: ${formatMoney(summary.oneOff)}` : `${standing.filter((e) => e.active).length} שירותים פעילים`}
          />
          <Kpi label="נשאר לך" value={formatMoney(net)} sub={`${formatMoney(net * 12)} בשנה, אם החודש הזה חוזר`} tone={net < 0 ? "negative" : "default"} />
          <Kpi
            label="שולי רווח"
            value={summary.marginPct === null ? "—" : percent(summary.marginPct)}
            sub={summary.breakEvenClients === null ? "מכל שקל שנכנס" : `עלויות קבועות מכוסות מ-${summary.breakEvenClients} לקוחות`}
            tone={summary.marginPct !== null && summary.marginPct < 0 ? "negative" : "default"}
          />
        </section>

        {summary.missing.length > 0 ? (
          <p role="status" className="mt-4 rounded-[22px] bg-crm-warm/60 px-5 py-3 text-[13px] leading-relaxed">
            לשירותים האלה עוד אין סכום או אחוז, ולכן הם לא נספרים בחישוב: <strong>{summary.missing.map((e) => e.name).join(", ")}</strong>. לחצו על העיפרון ליד כל אחד והוסיפו כמה משלמים.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className={cn("mt-4 px-1 text-[13px]", NEGATIVE)}>
            {error}
          </p>
        ) : null}

        {/* ── standing costs ────────────────────────────────────── */}
        <Glass className="mt-6 p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-medium">על מה אני משלם כל חודש</h2>
            <p className="text-[12px] text-crm-muted">
              שער הדולר בחישוב: <bdi dir="ltr">{usdIls}</bdi> ₪
            </p>
          </div>

          {standing.length === 0 ? <p className="rounded-[22px] bg-black/[0.045] px-5 py-6 text-center text-[14px] text-crm-ink/70">עוד לא הוספתם הוצאות קבועות. התחילו מהשירותים למטה.</p> : null}

          <ul className="space-y-2.5">
            {standing.map((e) => {
              const monthly = monthlyShekels(e, usdIls)
              const converted = monthly !== null && monthly > 0 && (e.currency === "USD" || e.period === "yearly")
              const parts: ReactNode[] = []
              if (e.amount !== null)
                parts.push(
                  <span key="fixed">
                    {money(e.amount, e.currency)} {e.period === "yearly" ? "לשנה" : "לחודש"}
                    {converted ? <span className="text-crm-muted"> · כ-{shekels(monthly)} לחודש</span> : null}
                  </span>,
                )
              if (e.percent !== null) parts.push(<span key="percent">{e.percent}% מההכנסה</span>)
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[26px] bg-black/[0.045] px-4 py-3.5 md:px-5">
                  <div className={cn("min-w-0 flex-1 basis-56", !e.active && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[15px] font-medium">{e.name}</span>
                      <Pill tone="white">{CATEGORY_LABEL[e.category]}</Pill>
                      {e.tenantId ? <Pill tone="soft">{clientName.get(e.tenantId) ?? "לקוח שהוסר"}</Pill> : null}
                      {!e.active ? <Pill tone="soft">מושהה</Pill> : null}
                      {e.amount === null && e.percent === null ? <Pill tone="warm">חסר סכום</Pill> : null}
                    </div>
                    <p className="mt-1 text-[13px] text-crm-ink/75">
                      {parts.length === 0 ? (
                        "עוד לא הוזן כמה משלמים"
                      ) : (
                        parts.map((part, i) => (
                          <span key={i}>
                            {i > 0 ? " + " : null}
                            {part}
                          </span>
                        ))
                      )}
                    </p>
                    {e.note ? <p className="mt-0.5 text-[12px] text-crm-muted">{e.note}</p> : null}
                  </div>
                  <Controls
                    expense={e}
                    busy={busy}
                    pausable
                    onToggle={() => run(() => actions.setExpenseActive(e.id, !e.active), e.active ? "ההוצאה הושהתה" : "ההוצאה פעילה שוב")}
                    onEdit={() => setDraft(draftOf(e))}
                    onDelete={() => setDeleting(e)}
                  />
                </li>
              )
            })}
          </ul>

          {suggestions.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 px-1 text-[12px] text-crm-muted">להוספה במהירות (תמלאו רק את הסכום)</h3>
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...blank, name: s.name, category: s.category, currency: s.currency, period: s.period, url: s.url })}
                      className="flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-crm-ink"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Glass>

        {/* ── what I spent by hand ──────────────────────────────── */}
        <Glass className="mt-4 p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-medium">הוצאות חד־פעמיות · {label}</h2>
              <p className="mt-1 text-[12px] text-crm-muted">פרסום שקנית, פרילנסר ששילמת לו, ציוד: כל דבר ששילמת פעם אחת, עם תאריך.</p>
            </div>
            <button type="button" onClick={newOneOff} className={secondary}>
              <Plus className="size-4" aria-hidden />
              הוספה
            </button>
          </div>

          {oneOffs.length === 0 ? <p className="rounded-[22px] bg-black/[0.045] px-5 py-6 text-center text-[14px] text-crm-ink/70">אין הוצאות חד־פעמיות ב{label}.</p> : null}

          <ul className="space-y-2.5">
            {oneOffs.map((e) => {
              const shekelValue = monthlyShekels(e, usdIls) ?? 0
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[26px] bg-black/[0.045] px-4 py-3.5 md:px-5">
                  <div className={cn("min-w-0 flex-1 basis-56", !e.active && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[15px] font-medium">{e.name}</span>
                      <Pill tone="white">{CATEGORY_LABEL[e.category]}</Pill>
                      {e.tenantId ? <Pill tone="soft">{clientName.get(e.tenantId) ?? "לקוח שהוסר"}</Pill> : null}
                      {!e.active ? <Pill tone="soft">מושהה</Pill> : null}
                    </div>
                    <p className="mt-1 text-[13px] text-crm-ink/75">
                      {e.spentOn ? dayLabel(e.spentOn) : null} · {e.amount === null ? "" : money(e.amount, e.currency)}
                      {e.currency === "USD" ? <span className="text-crm-muted"> · כ-{shekels(shekelValue)}</span> : null}
                    </p>
                    {e.note ? <p className="mt-0.5 text-[12px] text-crm-muted">{e.note}</p> : null}
                  </div>
                  <Controls expense={e} busy={busy} onEdit={() => setDraft(draftOf(e))} onDelete={() => setDeleting(e)} />
                </li>
              )
            })}
          </ul>
        </Glass>

        <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-5">
          <Glass className="p-5 md:p-6">
            <h2 className="mb-4 text-[17px] font-medium">לאן הולך הכסף</h2>
            {summary.byCategory.length === 0 ? (
              <p className="text-[14px] text-crm-ink/70">אחרי שתזינו סכומים יופיע כאן הפירוט לפי סוג.</p>
            ) : (
              <ul className="space-y-3.5">
                {summary.byCategory.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span>{c.label}</span>
                      <span className="tabular-nums text-crm-ink/80">
                        {formatMoney(c.total)} · {percent(c.total / summary.expenses)}
                      </span>
                    </div>
                    <div aria-hidden className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/[0.07]">
                      <div className="h-full rounded-full bg-crm-ink" style={{ width: `${Math.max(3, (c.total / summary.expenses) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Glass>

          <RateCard usdIls={usdIls} saveRate={actions.saveRate} />
        </div>

        {/* ── what each client leaves me ────────────────────────── */}
        <Glass className="mt-4 p-5 md:p-6">
          <h2 className="text-[17px] font-medium">כמה כל לקוח משאיר לי</h2>
          <p className="mb-4 mt-1 text-[12px] leading-relaxed text-crm-muted">
            מההכנסה של הלקוח יורדות העלויות שהוגדרו עליו בלבד, עמלת סליקה לפי מה שהוא משלם, וחלק שווה מהעלויות המשותפות (כל מה שלא הוגדר על לקוח מסוים).
          </p>
          {summary.perClient.length === 0 ? <p className="text-[14px] text-crm-ink/70">עוד אין לקוחות פעילים.</p> : null}
          <ul className="space-y-2.5">
            {summary.perClient.map((row) => (
              <li key={row.client.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[26px] bg-black/[0.045] px-4 py-3.5 md:px-5">
                <div className="min-w-0 basis-44">
                  <Link href={`/app/${row.client.slug}`} className="block truncate text-[15px] font-medium hover:underline">
                    {row.client.name}
                  </Link>
                  <p className="text-[12px] text-crm-muted">{row.income > 0 ? `משלם ${formatMoney(row.income)} לחודש` : "עדיין לא משלם"}</p>
                </div>
                <dl className="flex gap-5 text-[12px]">
                  <Figure label="עלות ישירה" value={shekels(row.direct)} />
                  <Figure label="חלק במשותף" value={shekels(row.shared)} />
                </dl>
                <div className="text-end">
                  <p className={cn("text-[18px] font-medium tabular-nums", row.margin < 0 && NEGATIVE)}>{shekels(row.margin)}</p>
                  <p className="text-[11px] text-crm-muted">{row.marginPct === null ? "נשאר" : `${percent(row.marginPct)} נשאר`}</p>
                </div>
              </li>
            ))}
          </ul>
        </Glass>
      </main>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        label={draft?.id ? "עריכת הוצאה" : draft?.kind === "once" ? "הוצאה חד־פעמית" : "הוצאה קבועה חדשה"}
        variant="bottom"
        className="md:!fixed md:!inset-0 md:!m-auto md:!h-fit md:!w-[min(92vw,34rem)]"
      >
        {draft ? <ExpenseForm initial={draft} today={today} clients={clients.filter((c) => !c.archived)} save={actions.saveExpense} onClose={() => setDraft(null)} onSavedMonth={(day) => day && setMonth(monthOf(day))} /> : null}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} label="מחיקת הוצאה">
        {deleting ? (
          <div className="crm-panel rounded-[32px] p-6">
            <h2 className="text-lg font-medium">למחוק את ״{deleting.name}״?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-crm-ink/80">
              {deleting.kind === "once" ? "ההוצאה תימחק מהרשימה ומחישובי החודש." : "זה יימחק מהרשימה ומהחישובים. אם אתם רק רוצים להפסיק לספור אותו, עדיף להשהות."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const target = deleting
                  setDeleting(null)
                  run(() => actions.deleteExpense(target.id), "ההוצאה נמחקה")
                }}
                className={cn(primaryButtonClass, "bg-[#b3261e] py-3")}
              >
                מחיקה
              </button>
              <button type="button" onClick={() => setDeleting(null)} className={secondary}>
                ביטול
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function Controls({ expense: e, busy, pausable, onToggle, onEdit, onDelete }: { expense: Expense; busy: boolean; pausable?: boolean; onToggle?: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {e.url ? (
        <a
          href={e.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-crm-ink"
        >
          ניהול
          <ArrowUpLeft className="size-3.5" aria-hidden />
        </a>
      ) : null}
      {pausable ? (
        <IconButton label={e.active ? `השהיית ${e.name}` : `חזרה לפעילות: ${e.name}`} size="sm" tone="white" disabled={busy} onClick={onToggle}>
          {e.active ? <Pause /> : <Play />}
        </IconButton>
      ) : null}
      <IconButton label={`עריכת ${e.name}`} size="sm" tone="white" onClick={onEdit}>
        <Pencil />
      </IconButton>
      <IconButton label={`מחיקת ${e.name}`} size="sm" tone="white" onClick={onDelete}>
        <Trash2 />
      </IconButton>
    </div>
  )
}

function Kpi({ label, value, sub, tone = "default" }: { label: string; value: string; sub: string; tone?: "default" | "negative" }) {
  return (
    <Glass className="p-4 md:p-5">
      <p className="text-[12px] text-crm-muted">{label}</p>
      <p className={cn("mt-1.5 text-[26px] font-medium leading-none tabular-nums tracking-tight md:text-[30px]", tone === "negative" && NEGATIVE)}>{value}</p>
      <p className="mt-2 text-[11px] leading-snug text-crm-muted">{sub}</p>
    </Glass>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-crm-muted">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{value}</dd>
    </div>
  )
}

function RateCard({ usdIls, saveRate }: { usdIls: number; saveRate: FinanceActions["saveRate"] }) {
  const router = useRouter()
  const toast = useToast()
  const [value, setValue] = useState(String(usdIls))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    start(async () => {
      try {
        const result = await saveRate(value)
        if (!result.ok) {
          setError(result.error)
          return
        }
        toast("השער עודכן")
        router.refresh()
      } catch {
        setError("אין חיבור כרגע. נסו שוב.")
      }
    })
  }

  return (
    <Glass className="p-5 md:p-6">
      <h2 className="text-[17px] font-medium">שער הדולר</h2>
      <p className="mb-4 mt-1 text-[12px] leading-relaxed text-crm-muted">משמש להפיכת שירותים שמחויבים בדולר לשקלים. עדכנו אותו מדי פעם לפי הדף של כרטיס האשראי.</p>
      <form onSubmit={submit} className="flex items-start gap-2">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">כמה שקלים שווה דולר אחד</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" dir="ltr" maxLength={6} className={cn(fieldClass, "text-end")} />
        </label>
        <button type="submit" disabled={pending} className={cn(primaryButtonClass, "py-3")}>
          {pending ? "שומר…" : "שמירה"}
        </button>
      </form>
      {error ? (
        <p role="alert" className={cn("mt-2 px-1 text-[13px]", NEGATIVE)}>
          {error}
        </p>
      ) : null}
    </Glass>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[12px] text-crm-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block px-1 text-[11px] text-crm-muted">{hint}</span> : null}
    </label>
  )
}

function ExpenseForm({
  initial,
  today,
  clients,
  save,
  onClose,
  onSavedMonth,
}: {
  initial: Draft
  today: string
  clients: Client[]
  save: FinanceActions["saveExpense"]
  onClose: () => void
  /** After a one-off is saved, show the month it landed in. */
  onSavedMonth: (day: string | null) => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [d, setD] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }))
  const once = d.kind === "once"

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    start(async () => {
      try {
        const result = await save(d.id, d)
        if (!result.ok) {
          setError(result.error)
          return
        }
        toast(d.id ? "ההוצאה עודכנה" : "ההוצאה נוספה")
        if (once) onSavedMonth(d.spentOn)
        onClose()
        router.refresh()
      } catch {
        setError("אין חיבור כרגע. נסו שוב.")
      }
    })
  }

  return (
    <form onSubmit={submit} className="crm-panel max-h-[92dvh] overflow-y-auto rounded-t-[32px] p-6 md:rounded-[32px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-medium">{d.id ? "עריכת הוצאה" : once ? "הוצאה חד־פעמית" : "הוצאה קבועה חדשה"}</h2>
        <IconButton label="סגירה" size="sm" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="space-y-3.5">
        {d.id === null ? (
          <Segmented<Kind>
            label="סוג ההוצאה"
            value={d.kind}
            onChange={(v) => set("kind", v)}
            options={[
              { value: "once", label: "חד־פעמית" },
              { value: "recurring", label: "מנוי / קבועה" },
            ]}
          />
        ) : null}
        <Field label={once ? "על מה הוצאתם" : "שם השירות"}>
          <input value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={FINANCE_LIMITS.name} autoComplete="off" className={fieldClass} />
        </Field>
        <div>
          <span className="mb-1.5 block px-1 text-[12px] text-crm-muted">סוג</span>
          <Select label="סוג" value={d.category} onChange={(v) => set("category", v as ExpenseCategory)} options={EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
        </div>
        <Field label={once ? "כמה שילמתם" : "כמה משלמים"} hint={once ? undefined : "השאירו ריק אם עוד לא יודעים. זה לא ייספר כאפס."}>
          <input value={d.amount} onChange={(e) => set("amount", e.target.value)} inputMode="decimal" dir="ltr" placeholder="0.00" autoComplete="off" required={once} className={cn(fieldClass, "text-end")} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Segmented<Currency> label="מטבע" value={d.currency} onChange={(v) => set("currency", v)} options={[{ value: "ILS", label: "₪ שקל" }, { value: "USD", label: "$ דולר" }]} />
          {once ? null : <Segmented<Period> label="כל כמה" value={d.period} onChange={(v) => set("period", v)} options={[{ value: "monthly", label: "בחודש" }, { value: "yearly", label: "בשנה" }]} />}
        </div>
        {once ? (
          <Field label="תאריך">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={d.spentOn}
                onChange={(e) => set("spentOn", e.target.value)}
                min="2020-01-01"
                max="2100-01-01"
                required
                dir="ltr"
                className={cn(fieldClass, "min-w-0 flex-1 basis-40 text-end")}
              />
              <button type="button" onClick={() => set("spentOn", today)} className="rounded-full bg-black/[0.07] px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.12]">
                היום
              </button>
              <button type="button" onClick={() => set("spentOn", shiftDay(today, -1))} className="rounded-full bg-black/[0.07] px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.12]">
                אתמול
              </button>
            </div>
          </Field>
        ) : (
          <Field label="עמלה באחוזים מההכנסה (אם יש)" hint="לסליקה, למשל Grow: האחוז שנגרע מכל תשלום של לקוח. אפשר גם סכום קבוע למעלה וגם אחוז.">
            <input value={d.percent} onChange={(e) => set("percent", e.target.value)} inputMode="decimal" dir="ltr" placeholder="1.5" maxLength={6} autoComplete="off" className={cn(fieldClass, "text-end")} />
          </Field>
        )}
        <div>
          <span className="mb-1.5 block px-1 text-[12px] text-crm-muted">על מי זה</span>
          <Select
            label="על מי זה"
            value={d.tenantId}
            onChange={(v) => set("tenantId", v)}
            options={[{ value: "", label: "על כולם (עלות משותפת)" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>
        {once ? null : (
          <Field label="קישור לניהול החשבון" hint="כדי לקפוץ ישר לחיובים. חייב להתחיל ב-https://">
            <input value={d.url} onChange={(e) => set("url", e.target.value)} inputMode="url" dir="ltr" placeholder="https://" maxLength={FINANCE_LIMITS.url} autoComplete="off" className={cn(fieldClass, "text-end")} />
          </Field>
        )}
        <Field label="הערה">
          <input value={d.note} onChange={(e) => set("note", e.target.value)} maxLength={FINANCE_LIMITS.note} autoComplete="off" className={fieldClass} />
        </Field>
      </div>
      {error ? (
        <p role="alert" className={cn("mt-4 text-[13px]", NEGATIVE)}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={cn(primaryButtonClass, "mt-6 w-full")}>
        {pending ? "שומר…" : "שמירה"}
      </button>
    </form>
  )
}
