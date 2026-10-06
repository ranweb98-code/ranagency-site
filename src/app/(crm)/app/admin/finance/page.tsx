import { todayInJerusalem } from "@/lib/crm/format"
import { CATEGORY_LABEL, type Client, type Expense, type ExpenseCategory } from "@/lib/crm/finance"
import { requireSuperAdmin } from "@/lib/crm/session"
import { createClient } from "@/lib/supabase/server"
import { deleteExpense, saveExpense, saveRate, setExpenseActive } from "./actions"
import { FinanceView } from "./finance-view"

export const metadata = { title: "הכספים שלי" }

const isCategory = (value: string): value is ExpenseCategory => value in CATEGORY_LABEL

export default async function FinancePage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  const [expenses, settings, tenants] = await Promise.all([
    supabase.from("admin_expenses").select("*").order("created_at"),
    supabase.from("admin_settings").select("usd_ils").maybeSingle(),
    supabase.from("tenants").select("id, slug, business_name, plan_monthly, archived_at").order("created_at"),
  ])
  for (const result of [expenses, settings, tenants]) if (result.error) throw new Error(`Finance query failed: ${result.error.message}`)

  const rows: Expense[] = (expenses.data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    category: isCategory(e.category) ? e.category : "other",
    amount: e.amount === null ? null : Number(e.amount),
    currency: e.currency === "USD" ? "USD" : "ILS",
    period: e.period === "yearly" ? "yearly" : "monthly",
    kind: e.kind === "once" ? "once" : "recurring",
    spentOn: e.spent_on,
    percent: e.percent === null ? null : Number(e.percent),
    tenantId: e.tenant_id,
    url: e.url,
    note: e.note,
    active: e.active,
  }))

  const clients: Client[] = (tenants.data ?? []).map((t) => ({
    id: t.id,
    name: t.business_name,
    slug: t.slug,
    plan: Number(t.plan_monthly),
    archived: t.archived_at !== null,
  }))

  return <FinanceView expenses={rows} clients={clients} usdIls={Number(settings.data?.usd_ils ?? 3.7)} today={todayInJerusalem()} actions={{ saveExpense, setExpenseActive, deleteExpense, saveRate }} />
}
