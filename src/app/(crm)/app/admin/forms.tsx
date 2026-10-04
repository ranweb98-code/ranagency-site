"use client"

import { Check, Plus } from "lucide-react"
import { useActionState, useId } from "react"

import { ChoiceChip } from "@/components/crm/ui/choice-chip"
import { fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { Select } from "@/components/crm/ui/select"
import { cn } from "@/lib/utils"
import { createBusiness, inviteUser, type AdminState } from "./actions"


const initial: AdminState = { ok: false }

const AGENT_OPTIONS = [
  { value: "whatsapp", label: "וואטסאפ" },
  { value: "instagram", label: "אינסטגרם" },
  { value: "voice", label: "טלפון" },
]

function Status({ state }: { state: AdminState }) {
  return (
    <div aria-live="polite">
      {state.error ? (
        <p role="alert" className="mt-3 text-[13px] text-[#b3261e]">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <div className="mt-3 rounded-2xl bg-black/[0.06] px-4 py-3 text-[13px] leading-relaxed">
          <p className="flex items-start gap-2">
            {state.ok ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
            {state.message}
          </p>
          {state.loginUrl ? (
            <bdi dir="ltr" className="mt-1.5 block break-all font-medium">
              {state.loginUrl}
            </bdi>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function NewBusinessForm({ industries }: { industries: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createBusiness, initial)
  const id = useId()

  return (
    <form action={action} className="space-y-3">
      <div className="grid items-start gap-3 sm:grid-cols-2">
        <input name="business_name" required placeholder="שם העסק" aria-label="שם העסק" className={fieldClass} autoComplete="off" />
        <Select name="industry" label="תחום" placeholder="תחום" options={industries.map((i) => ({ value: i.id, label: i.label }))} />
        <div>
          <input
            name="slug"
            required
            dir="ltr"
            placeholder="dr-cohen"
            aria-label="כתובת העסק באנגלית"
            aria-describedby={`${id}-slug`}
            pattern="[a-z0-9][a-z0-9\-]{2,39}"
            className={cn(fieldClass, "text-end")}
            autoComplete="off"
          />
          <p id={`${id}-slug`} className="mt-1 px-1 text-[11px] text-crm-muted">
            כתובת העסק באנגלית, בתוך <bdi dir="ltr">napuch.co.il/app/…</bdi> (אותיות קטנות, ספרות ומקף)
          </p>
        </div>
        <input name="owner_name" placeholder="שם בעל העסק" aria-label="שם בעל העסק" className={fieldClass} autoComplete="off" />
        <input name="owner_email" type="email" required dir="ltr" placeholder="מייל בעל העסק (להזמנה)" aria-label="מייל בעל העסק" className={cn(fieldClass, "text-end")} autoComplete="off" />
        <input name="city" placeholder="עיר" aria-label="עיר" className={fieldClass} autoComplete="off" />
        <input name="tagline" placeholder="משפט קצר על העסק (לא חובה)" aria-label="משפט קצר על העסק" className={cn(fieldClass, "sm:col-span-2")} autoComplete="off" />
        <label className="block">
          <span className="mb-1 block px-1 text-[11px] text-crm-muted">מחיר חודשי בשקלים</span>
          <span className="relative block">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 start-5 grid place-items-center text-[15px] text-crm-muted">
              ₪
            </span>
            <input name="plan_monthly" inputMode="numeric" pattern="[0-9]{1,6}" maxLength={6} defaultValue="0" className={cn(fieldClass, "ps-11")} />
          </span>
        </label>
        <fieldset>
          <legend className="mb-1 px-1 text-[11px] text-crm-muted">סוכנים שנרכשו</legend>
          <div className="flex flex-wrap items-center gap-2 py-0.5">
            {AGENT_OPTIONS.map((a) => (
              <ChoiceChip key={a.value} name="agents" value={a.value} defaultChecked label={a.label} />
            ))}
          </div>
        </fieldset>
      </div>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        <Plus className="size-4" aria-hidden />
        {pending ? "יוצר…" : "יצירת עסק והזמנת הבעלים"}
      </button>
      <Status state={state} />
    </form>
  )
}

export function InviteForm({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState(inviteUser, initial)

  return (
    <form action={action}>
      <input type="hidden" name="tenant_id" value={tenantId} />
      <div className="flex flex-wrap gap-2">
        <input name="email" type="email" required dir="ltr" placeholder="מייל להזמנה" aria-label="מייל להזמנה" className={cn(fieldClass, "min-w-0 flex-1 basis-48 py-2.5 text-end")} autoComplete="off" />
        <Select
          name="role"
          label="תפקיד"
          defaultValue="staff"
          className="w-auto min-w-32 py-2.5"
          options={[
            { value: "staff", label: "צוות" },
            { value: "owner", label: "בעלים" },
          ]}
        />
        <button type="submit" disabled={pending} className={cn(primaryButtonClass, "py-2.5")}>
          {pending ? "שולח…" : "הזמנה"}
        </button>
      </div>
      <Status state={state} />
    </form>
  )
}
