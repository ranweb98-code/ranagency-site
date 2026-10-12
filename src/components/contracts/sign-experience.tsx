"use client"

import { Check, ChevronDown, Loader2, Mail } from "lucide-react"
import { useRef, useState } from "react"

import { Logo } from "@/components/site/logo"
import { cn } from "@/lib/utils"
import { SignaturePad, type SignaturePadHandle } from "./signature-pad"

export interface DocSection {
  title: string
  paragraphs: string[]
}

export interface SignProps {
  token: string
  title: string
  businessName: string
  summary: string[]
  preamble: string[]
  sections: DocSection[]
  privacyTitle: string
  privacySections: DocSection[]
  privacyPreamble: string[]
  defaultName: string
}

type Step = "form" | "code" | "done"

const ERRORS: Record<string, string> = {
  name: "נא להקליד שם מלא.",
  consent: "יש לסמן את שני האישורים.",
  signature: "נא לחתום בתוך המסגרת.",
  rate_limited: "נסו שוב בעוד כמה דקות.",
  too_many_codes: "נשלחו יותר מדי קודים. נסו שוב בעוד שעה.",
  wrong_code: "הקוד שגוי. נסו שוב.",
  too_many_attempts: "יותר מדי ניסיונות. בקשו קוד חדש.",
  code_expired: "הקוד פג תוקף. בקשו קוד חדש.",
  code_format: "הקוד הוא 6 ספרות.",
  email: "לא הצלחנו לשלוח את הקוד למייל. נסו שוב.",
  state: "הקישור כבר לא פעיל. רעננו את העמוד.",
}
const errorText = (code: string) => ERRORS[code] ?? "משהו השתבש. נסו שוב."

const card = "rounded-3xl border border-ran-glass-border-light bg-white p-5 sm:p-7"
const primaryButton =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ran-text-on-light px-8 text-lg font-bold text-white transition active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ran-text-on-light disabled:opacity-60"
const field =
  "h-13 w-full rounded-2xl border-2 border-[rgba(17,17,17,0.2)] bg-white px-4 text-base outline-none transition focus-visible:border-ran-text-on-light"

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, index) => (
        <p key={index} className="whitespace-pre-line text-[15px] leading-relaxed text-ran-text-on-light/85">
          {p}
        </p>
      ))}
    </>
  )
}

function Accordion({ sections, label }: { sections: DocSection[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="divide-y divide-ran-glass-border-light overflow-hidden rounded-2xl border border-ran-glass-border-light">
      {sections.map((section) => (
        <details key={section.title} className="group bg-white">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold marker:hidden focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ran-text-on-light [&::-webkit-details-marker]:hidden">
            <span>{section.title}</span>
            <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <Paragraphs items={section.paragraphs} />
          </div>
        </details>
      ))}
    </div>
  )
}

export function SignExperience(props: SignProps) {
  const [step, setStep] = useState<Step>("form")
  const [typedName, setTypedName] = useState(props.defaultName)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [padEmpty, setPadEmpty] = useState(true)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [code, setCode] = useState("")
  const [emailHint, setEmailHint] = useState("")
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const pad = useRef<SignaturePadHandle>(null)
  const [submitted, setSubmitted] = useState(false)

  const missingName = typedName.trim().length < 2
  const missingConsent = !terms || !privacy

  async function post(path: string, body: unknown): Promise<{ ok: boolean; error?: string; [key: string]: unknown }> {
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      return await response.json()
    } catch {
      return { ok: false, error: "network" }
    }
  }

  async function begin() {
    setSubmitted(true)
    setError("")
    if (missingConsent || missingName || padEmpty) {
      setError(missingConsent ? errorText("consent") : missingName ? errorText("name") : errorText("signature"))
      return
    }
    setBusy(true)
    const result = await post("/api/sign/begin", {
      token: props.token,
      typedName: typedName.trim(),
      terms,
      privacy,
      signature: pad.current?.toDataUrl(),
    })
    setBusy(false)
    if (!result.ok) return setError(errorText(result.error ?? ""))
    setEmailHint(String(result.emailHint ?? ""))
    setCode("")
    setStep("code")
  }

  async function verify() {
    setError("")
    if (!/^\d{6}$/.test(code)) return setError(errorText("code_format"))
    setBusy(true)
    const result = await post("/api/sign/verify", { token: props.token, code })
    setBusy(false)
    if (!result.ok) return setError(errorText(result.error ?? ""))
    setPaymentUrl(typeof result.paymentUrl === "string" ? result.paymentUrl : null)
    setStep("done")
  }

  if (step === "done") {
    return (
      <Shell>
        <section className={cn(card, "text-center")} aria-live="polite">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-ran-text-on-light text-white">
            <Check className="size-8" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold">ההסכם נחתם</h1>
          <p className="mx-auto mt-3 max-w-sm text-[16px] leading-relaxed text-ran-text-on-light-muted">
            תודה, {props.businessName}. שלחנו עותק PDF של ההסכם החתום למייל שלכם.
          </p>
          {paymentUrl ? (
            <div className="mt-7">
              <p className="mb-3 text-[15px] font-semibold">השלב הבא: התשלום הראשון</p>
              <a href={paymentUrl} className={primaryButton}>
                המשך לתשלום
              </a>
            </div>
          ) : (
            <p className="mt-6 text-[15px] text-ran-text-on-light-muted">נחזור אליכם בהקדם עם השלבים הבאים.</p>
          )}
        </section>
      </Shell>
    )
  }

  if (step === "code") {
    return (
      <Shell>
        <section className={card}>
          <div className="mb-5 grid size-14 place-items-center rounded-full bg-ran-text-on-light text-white">
            <Mail className="size-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold">עוד צעד אחד</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ran-text-on-light-muted">
            שלחנו קוד בן 6 ספרות אל{" "}
            <bdi dir="ltr" className="font-semibold text-ran-text-on-light">
              {emailHint}
            </bdi>
            . ההסכם נכנס לתוקף רק אחרי שתזינו אותו.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void verify()
            }}
          >
            <label htmlFor="otp" className="block text-[15px] font-semibold">
              קוד אימות
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className={cn(field, "text-center text-2xl font-bold tracking-[0.4em]")}
              aria-describedby={error ? "form-error" : undefined}
              aria-invalid={error ? true : undefined}
              autoFocus
            />
            {error ? (
              <p id="form-error" role="alert" className="text-[15px] font-medium text-[#b3261e]">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              {busy ? "חותם…" : "אישור וחתימה"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-3 text-[15px]">
            <button type="button" disabled={busy} onClick={() => void begin()} className="underline underline-offset-4 disabled:opacity-50">
              שלחו לי קוד חדש
            </button>
            <button type="button" disabled={busy} onClick={() => setStep("form")} className="underline underline-offset-4 disabled:opacity-50">
              חזרה
            </button>
          </div>
        </section>
      </Shell>
    )
  }

  return (
    <Shell>
      <header className="px-1 pt-1">
        <h1 className="text-[28px] font-bold leading-tight sm:text-4xl">{props.title}</h1>
        <p className="mt-2 text-[17px] text-ran-text-on-light-muted">
          הסכם עבור <span className="font-semibold text-ran-text-on-light">{props.businessName}</span>
        </p>
      </header>

      <section className={card} aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-xl font-bold">
          בקצרה
        </h2>
        <ul className="mt-4 space-y-3">
          {props.summary.map((item, index) => (
            <li key={index} className="flex gap-3 text-[16px] leading-relaxed">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ran-text-on-light text-xs font-bold text-white" aria-hidden>
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="full-title">
        <h2 id="full-title" className="text-xl font-bold">
          ההסכם המלא
        </h2>
        <p className="mb-4 mt-1 text-[15px] text-ran-text-on-light-muted">לחצו על סעיף כדי לקרוא.</p>
        <div className="mb-4 space-y-3">
          <Paragraphs items={props.preamble} />
        </div>
        <Accordion sections={props.sections} label="סעיפי ההסכם" />
        <p className="mt-4 text-[15px]">
          <button type="button" onClick={() => setShowPrivacy((v) => !v)} aria-expanded={showPrivacy} aria-controls="privacy-panel" className="font-semibold underline underline-offset-4">
            {showPrivacy ? "הסתרת מדיניות הפרטיות" : "קריאת מדיניות הפרטיות"}
          </button>
        </p>
        {showPrivacy ? (
          <div id="privacy-panel" className="mt-3 space-y-3 rounded-2xl bg-ran-surface-subtle p-4">
            <h3 className="text-lg font-bold">{props.privacyTitle}</h3>
            <Paragraphs items={props.privacyPreamble} />
            <Accordion sections={props.privacySections} label="סעיפי מדיניות הפרטיות" />
          </div>
        ) : null}
      </section>

      <form
        className={cn(card, "space-y-5")}
        aria-labelledby="sign-title"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void begin()
        }}
      >
        <h2 id="sign-title" className="text-xl font-bold">
          חתימה
        </h2>

        <label className="flex min-h-12 cursor-pointer items-start gap-3 text-[16px] leading-snug">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[#111]" aria-invalid={submitted && !terms ? true : undefined} />
          <span>קראתי והסכמתי להסכם</span>
        </label>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 text-[16px] leading-snug">
          <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[#111]" aria-invalid={submitted && !privacy ? true : undefined} />
          <span>קראתי את מדיניות הפרטיות</span>
        </label>

        <div>
          <label htmlFor="typed-name" className="mb-2 block text-[15px] font-semibold">
            שם מלא
          </label>
          <input
            id="typed-name"
            name="name"
            autoComplete="name"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            className={field}
            aria-invalid={submitted && missingName ? true : undefined}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span id="pad-label" className="text-[15px] font-semibold">
              חתימה
            </span>
            <button
              type="button"
              onClick={() => pad.current?.clear()}
              className="min-h-11 rounded-full px-4 text-[15px] font-semibold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-ran-text-on-light"
            >
              נקה
            </button>
          </div>
          <SignaturePad ref={pad} onChange={setPadEmpty} invalid={submitted && padEmpty} describedBy="pad-help" />
          <p id="pad-help" className="mt-2 text-[14px] text-ran-text-on-light-muted">
            חתמו בתוך המסגרת באצבע.{" "}
            <button
              type="button"
              onClick={() => (missingName ? setError(errorText("name")) : pad.current?.drawText(typedName.trim()))}
              className="underline underline-offset-4"
            >
              אי אפשר לצייר? חתימה בהקלדת השם
            </button>
          </p>
        </div>

        {error ? (
          <p id="form-error" role="alert" className="text-[15px] font-medium text-[#b3261e]">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className={cn(primaryButton, "h-16 text-xl")}>
          {busy ? <Loader2 className="size-6 animate-spin" aria-hidden /> : null}
          {busy ? "שולח קוד…" : "חתום"}
        </button>
        <p className="text-center text-[14px] text-ran-text-on-light-muted">אחרי הלחיצה נשלח קוד אימות למייל שלכם.</p>
      </form>
    </Shell>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-16 pt-5 sm:gap-5 sm:pt-8">
      <div className="px-1">
        <Logo height={26} />
      </div>
      {children}
    </main>
  )
}

export function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <section className={cn(card, "text-center")}>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-[16px] leading-relaxed text-ran-text-on-light-muted">{body}</p>
      </section>
    </Shell>
  )
}
