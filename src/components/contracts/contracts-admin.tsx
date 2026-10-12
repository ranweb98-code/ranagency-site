"use client"

import { Copy, Download, Mail, MessageCircle, Plus, Ban } from "lucide-react"
import { useActionState, useState, useTransition } from "react"

import { Logo } from "@/components/site/logo"
import { cn } from "@/lib/utils"
import {
  createContractAction,
  markSentAction,
  pdfDownloadLinkAction,
  revokeContractAction,
  sendContractEmailAction,
  type CreateState,
} from "@/app/(contracts)/admin/contracts/actions"

export interface ContractRow {
  id: string
  status: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  setup_fee_ils: number
  monthly_fee_ils: number
  agreement_version: string
  created_at: string
  expires_at: string
  sent_at: string | null
  viewed_at: string | null
  signed_at: string | null
  terms_accepted_at: string | null
  privacy_accepted_at: string | null
  otp_verified: boolean
  signer_ip: string | null
  agreement_sha256: string
  pdf_sha256: string | null
  link: string | null
  events: { type: string; at: string }[]
}

const STATUS: Record<string, string> = { draft: "טיוטה", sent: "נשלח", viewed: "נפתח", signed: "נחתם", expired: "פג תוקף", revoked: "בוטל" }
const EVENT: Record<string, string> = {
  created: "נוצר", sent: "נשלח", opened: "נפתח", consented: "אישר והזין חתימה", otp_sent: "נשלח קוד", otp_verified: "קוד אומת", otp_failed: "קוד שגוי", signed: "נחתם", revoked: "בוטל", expired: "פג תוקף",
}

const field = "h-11 w-full rounded-xl border border-[rgba(17,17,17,0.2)] bg-white px-3 text-[15px] outline-none focus-visible:border-ran-text-on-light"
const pill = "inline-flex min-h-10 items-center gap-2 rounded-full border border-[rgba(17,17,17,0.2)] bg-white px-4 text-[14px] font-semibold transition hover:bg-ran-surface-subtle disabled:opacity-50"
const dark = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ran-text-on-light px-7 text-[15px] font-bold text-white disabled:opacity-60"

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(iso)) : "—"

function whatsappUrl(phone: string, link: string): string {
  const digits = phone.replace(/\D/g, "")
  const intl = digits.startsWith("972") ? digits : digits.replace(/^0/, "972")
  return `https://wa.me/${intl}?text=${encodeURIComponent(`שלום, זה ההסכם עם נפוץ' AI לחתימה מהנייד (פחות מ-2 דקות): ${link}`)}`
}

export function ContractsAdmin({ email, rows }: { email: string; rows: ContractRow[] }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createContractAction, {})
  const [notice, setNotice] = useState("")
  const [busy, startTransition] = useTransition()

  const run = (job: () => Promise<void>) => startTransition(job)

  async function copy(link: string, id?: string) {
    try {
      await navigator.clipboard.writeText(link)
      setNotice("הקישור הועתק")
    } catch {
      setNotice("ההעתקה נכשלה, העתיקו ידנית")
    }
    if (id) await markSentAction(id)
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-20 pt-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Logo height={26} />
          <h1 className="mt-3 text-3xl font-bold">חוזים</h1>
        </div>
        <p className="text-[13px] text-ran-text-on-light-muted" dir="ltr">
          {email}
        </p>
      </header>

      <div role="status" aria-live="polite" className="min-h-6 text-[14px] font-semibold">
        {notice}
      </div>

      <section className="rounded-3xl border border-ran-glass-border-light bg-white p-5 sm:p-7" aria-labelledby="new-title">
        <h2 id="new-title" className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Plus className="size-5" aria-hidden /> חוזה חדש
        </h2>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          {[
            ["business_name", "שם העסק", "organization"],
            ["contact_name", "איש קשר", "off"],
            ["email", "מייל", "off"],
            ["phone", "טלפון", "off"],
            ["tax_id", "ח.פ. / ת.ז.", "off"],
            ["address", "כתובת", "off"],
          ].map(([name, label, ac]) => (
            <label key={name} className="block text-[14px] font-semibold">
              {label}
              <input name={name} required autoComplete={ac} dir={name === "email" || name === "phone" ? "ltr" : undefined} className={cn(field, "mt-1.5 font-normal")} />
            </label>
          ))}
          <label className="block text-[14px] font-semibold">
            דמי הקמה (ש&quot;ח)
            <input name="setup_fee" required inputMode="numeric" defaultValue="2500" dir="ltr" className={cn(field, "mt-1.5 font-normal")} />
          </label>
          <label className="block text-[14px] font-semibold">
            לחודש (ש&quot;ח)
            <input name="monthly_fee" required inputMode="numeric" defaultValue="800" dir="ltr" className={cn(field, "mt-1.5 font-normal")} />
          </label>
          <div className="sm:col-span-2">
            {state.error ? (
              <p role="alert" className="mb-3 text-[14px] font-semibold text-[#b3261e]">
                {state.error}
              </p>
            ) : null}
            <button type="submit" disabled={pending} className={dark}>
              {pending ? "יוצר…" : "צור קישור"}
            </button>
          </div>
        </form>

        {state.created ? (
          <div className="mt-5 space-y-3 rounded-2xl bg-ran-surface-subtle p-4" role="status">
            <p className="text-[14px] font-semibold">הקישור נוצר (תקף ל-14 יום):</p>
            <p dir="ltr" className="break-all rounded-xl bg-white p-3 text-[13px]">
              {state.created.link}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pill} onClick={() => void copy(state.created!.link, state.created!.id)}>
                <Copy className="size-4" aria-hidden /> העתק
              </button>
            </div>
            <p className="text-[13px] text-ran-text-on-light-muted">לשליחה בוואטסאפ או במייל השתמשו בכפתורים בשורה ברשימה למטה.</p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="list-title" className="space-y-3">
        <h2 id="list-title" className="text-xl font-bold">
          כל החוזים ({rows.length})
        </h2>
        {rows.length === 0 ? <p className="text-ran-text-on-light-muted">עדיין אין חוזים.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-ran-glass-border-light bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{row.business_name}</h3>
                <p className="text-[14px] text-ran-text-on-light-muted">
                  {row.contact_name} · <bdi dir="ltr">{row.email}</bdi> · <bdi dir="ltr">{row.phone}</bdi>
                </p>
                <p className="text-[14px] text-ran-text-on-light-muted">
                  {row.setup_fee_ils.toLocaleString("en-US")} ש&quot;ח הקמה + {row.monthly_fee_ils.toLocaleString("en-US")} ש&quot;ח לחודש · גרסה {row.agreement_version}
                </p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", row.status === "signed" ? "bg-ran-text-on-light text-white" : "bg-ran-surface-subtle")}>{STATUS[row.status] ?? row.status}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {row.link ? (
                <>
                  <button type="button" className={pill} onClick={() => void copy(row.link!, row.id)}>
                    <Copy className="size-4" aria-hidden /> העתק קישור
                  </button>
                  <a className={pill} href={whatsappUrl(row.phone, row.link)} target="_blank" rel="noreferrer" onClick={() => void markSentAction(row.id)}>
                    <MessageCircle className="size-4" aria-hidden /> וואטסאפ
                  </a>
                  <button
                    type="button"
                    className={pill}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        if (!window.confirm(`לשלוח מייל עם הקישור אל ${row.email}?`)) return
                        const result = await sendContractEmailAction(row.id)
                        setNotice(result.ok ? "המייל נשלח" : (result.error ?? "השליחה נכשלה"))
                      })
                    }
                  >
                    <Mail className="size-4" aria-hidden /> שלח במייל
                  </button>
                  <button
                    type="button"
                    className={pill}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        if (!window.confirm("לבטל את הקישור? הלקוח לא יוכל לחתום.")) return
                        const result = await revokeContractAction(row.id)
                        setNotice(result.ok ? "הקישור בוטל" : "הביטול נכשל")
                      })
                    }
                  >
                    <Ban className="size-4" aria-hidden /> בטל קישור
                  </button>
                </>
              ) : null}
              {row.status === "signed" ? (
                <button
                  type="button"
                  className={pill}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const url = await pdfDownloadLinkAction(row.id)
                      if (url) window.location.assign(url)
                    })
                  }
                >
                  <Download className="size-4" aria-hidden /> הורד PDF חתום
                </button>
              ) : null}
            </div>

            <details className="mt-4 text-[14px]">
              <summary className="cursor-pointer font-semibold">פרטים ולוג אירועים</summary>
              <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <div>נוצר: {when(row.created_at)}</div>
                <div>תוקף עד: {when(row.expires_at)}</div>
                <div>נשלח: {when(row.sent_at)}</div>
                <div>נפתח: {when(row.viewed_at)}</div>
                <div>אישר הסכם: {when(row.terms_accepted_at)}</div>
                <div>אישר פרטיות: {when(row.privacy_accepted_at)}</div>
                <div>נחתם: {when(row.signed_at)}</div>
                <div>אומת בקוד: {row.otp_verified ? "כן" : "לא"}</div>
                <div dir="ltr" className="text-right">IP: {row.signer_ip ?? "—"}</div>
              </dl>
              <p dir="ltr" className="mt-2 break-all text-right text-[12px] text-ran-text-on-light-muted">
                agreement sha256: {row.agreement_sha256}
                {row.pdf_sha256 ? ` · pdf sha256: ${row.pdf_sha256}` : ""}
              </p>
              <ol className="mt-3 space-y-1">
                {row.events.map((event, index) => (
                  <li key={index}>
                    {when(event.at)} · {EVENT[event.type] ?? event.type}
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
      </section>
    </main>
  )
}
