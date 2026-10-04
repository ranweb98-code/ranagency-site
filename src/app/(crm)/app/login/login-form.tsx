"use client"

import { ArrowLeft, Mail } from "lucide-react"
import { useActionState } from "react"

import { cn } from "@/lib/utils"
import { loginAction, type LoginState } from "./actions"

const field =
  "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3.5 text-[16px] outline-none transition-colors placeholder:text-crm-muted focus:border-crm-ink/40 focus:bg-white"
const primary =
  "flex w-full items-center justify-center gap-2 rounded-full bg-crm-ink py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
const quiet = "text-[13px] text-crm-ink/70 underline-offset-4 hover:underline disabled:opacity-50"

const initial: LoginState = { step: "email", email: "" }

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial)

  if (state.step === "code") {
    return (
      <form action={action}>
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="next" value={next} />

        <div className="mb-5 grid size-12 place-items-center rounded-full bg-crm-ink text-white">
          <Mail className="size-5" aria-hidden />
        </div>
        <h1 className="text-[26px] font-medium leading-tight tracking-tight">בדקו את המייל</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-crm-ink/70">
          שלחנו קישור כניסה אל{" "}
          <bdi dir="ltr" className="font-medium text-crm-ink">
            {state.email}
          </bdi>
          . לחצו עליו ותיכנסו. אם פתחתם אותו במכשיר אחר, אפשר להקליד כאן את הקוד מהמייל.
        </p>

        <div className="mt-6 space-y-3">
          <label className="sr-only" htmlFor="token">
            קוד מהמייל
          </label>
          <input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            placeholder="הקוד מהמייל"
            className={cn(field, "text-center tracking-[0.3em]")}
            aria-describedby={state.error ? "login-error" : undefined}
            aria-invalid={state.error ? true : undefined}
          />
          {state.error ? (
            <p id="login-error" role="alert" className="text-[13px] text-[#b3261e]">
              {state.error}
            </p>
          ) : null}
          <button type="submit" name="intent" value="verify" disabled={pending} className={primary}>
            {pending ? "בודק…" : "כניסה עם הקוד"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="submit" name="intent" value="change" formNoValidate className={quiet}>
            לא המייל הנכון? החלפה
          </button>
          <button type="submit" name="intent" value="send" formNoValidate disabled={pending} className={quiet}>
            שליחה מחדש
          </button>
        </div>
      </form>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value="send" />

      <h1 className="text-[30px] font-medium leading-tight tracking-tight">כניסה למערכת</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-crm-ink/70">נשלח אליכם קישור כניסה למייל. בלי סיסמה, בלי להירשם.</p>
      {notice ? (
        <p role="status" className="mt-4 rounded-2xl bg-black/[0.06] px-4 py-3 text-[13px]">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <label className="sr-only" htmlFor="email">
          כתובת מייל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          defaultValue={state.email}
          placeholder="name@business.co.il"
          className={cn(field, "text-end")}
          aria-describedby={state.error ? "login-error" : undefined}
          aria-invalid={state.error ? true : undefined}
        />
        {state.error ? (
          <p id="login-error" role="alert" className="text-[13px] text-[#b3261e]">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "שולח…" : "שלחו לי קישור כניסה"}
          {pending ? null : <ArrowLeft className="size-4" aria-hidden />}
        </button>
      </div>
    </form>
  )
}
