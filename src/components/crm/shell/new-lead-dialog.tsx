"use client"

import { AtSign, Check, Footprints, Phone, User, UserPlus, X, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent, type ReactNode } from "react"

import { CHANNELS } from "@/components/crm/ui/channel"
import { fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Modal } from "@/components/crm/ui/modal"
import { Select } from "@/components/crm/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "./toast"

// The demo also offers "walk-in"; a real lead needs one of the three channels
// the database knows, so a walk-in who leaves a number is entered as a phone lead.
const DEMO_SOURCES = ["וואטסאפ", "אינסטגרם", "טלפון", "הגיע ישירות"]
const LIVE_SOURCES = ["וואטסאפ", "אינסטגרם", "טלפון"]

// Each source wears the colour and glyph of its channel everywhere else in the product.
const SOURCE_LOOK: Record<string, { icon: LucideIcon; color: string }> = {
  וואטסאפ: CHANNELS.whatsapp,
  אינסטגרם: CHANNELS.instagram,
  טלפון: CHANNELS.voice,
  "הגיע ישירות": { icon: Footprints, color: "#b45309" },
}

function Labeled({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 text-[12px] font-medium text-crm-muted">
        {label}
        {optional ? <span className="font-normal opacity-70"> · לא חובה</span> : null}
      </p>
      {children}
    </div>
  )
}

export interface LeadInput {
  name: string
  phone: string
  instagram: string
  itemId: string
  source: string
}
export type CreateLead = (input: LeadInput) => Promise<{ ok: true } | { ok: false; error: string }>

/** Manual lead entry — for the walk-in or the phone call no agent took. */
export function NewLeadDialog({
  open,
  onClose,
  personLabel,
  items,
  createLead,
}: {
  open: boolean
  onClose: () => void
  personLabel: string
  items: { id: string; title: string }[]
  /** Given in a real workspace; the demo has nothing to save to. */
  createLead?: CreateLead
}) {
  const toast = useToast()
  const router = useRouter()
  const SOURCES = createLead ? LIVE_SOURCES : DEMO_SOURCES
  const [source, setSource] = useState(SOURCES[0])
  const instagram = source === "אינסטגרם"
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createLead) {
      // Demo build: the toast says so rather than pretending the lead exists.
      toast("בגרסת ההדגמה הליד לא נשמר. בעסק אמיתי הוא נשמר ומופיע בכל המסכים.")
      onClose()
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)
    setError(null)
    startTransition(async () => {
      const result = await createLead({
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        instagram: source === "אינסטגרם" ? String(data.get("instagram") ?? "") : "",
        itemId: String(data.get("item") ?? ""),
        source,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      form.reset()
      toast("הליד נוסף")
      onClose()
      router.refresh()
    })
  }

  return (
    <Modal open={open} onClose={onClose} label="הוספת ליד" variant="bottom" className="md:!fixed md:!inset-0 md:!m-auto md:!h-fit md:!w-[min(92vw,30rem)]">
      <form onSubmit={submit} className="crm-panel overflow-hidden rounded-t-[32px] p-6 md:rounded-[32px]">
        <div className="mb-6 flex items-start gap-3.5">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full text-[var(--crm-accent)]"
            style={{ backgroundColor: "color-mix(in srgb, var(--crm-accent) 14%, white)" }}
          >
            <UserPlus className="size-6" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-xl font-semibold leading-tight">ליד חדש</h2>
            <p className="mt-1 text-[13px] leading-snug text-crm-muted">שם ופרט ליצירת קשר מספיקים. אפשר להשלים את השאר אחר כך.</p>
          </div>
          <IconButton label="סגירה" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        <div className="space-y-4">
          <Labeled label="מאיפה הגיע">
            <div className={cn("grid gap-2", SOURCES.length === 4 ? "grid-cols-2" : "grid-cols-3")} role="radiogroup" aria-label="מקור">
              {SOURCES.map((s) => {
                const look = SOURCE_LOOK[s]
                const Icon = look.icon
                const on = source === s
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSource(s)}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink",
                      on ? "border-transparent text-crm-ink" : "border-black/10 bg-white/60 text-crm-ink/75 hover:bg-white",
                    )}
                    style={on ? { backgroundColor: `color-mix(in srgb, ${look.color} 14%, white)`, boxShadow: `inset 0 0 0 1.5px ${look.color}` } : undefined}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: look.color }}>
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-start">{s}</span>
                    {on ? <Check className="size-4 shrink-0" style={{ color: look.color }} aria-hidden /> : null}
                  </button>
                )
              })}
            </div>
          </Labeled>
          <Labeled label={`שם ה${personLabel}`}>
            <div className="relative">
              <User aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-crm-muted" />
              <input name="name" required placeholder="דנה כהן" className={cn(fieldClass, "ps-12")} aria-label="שם" autoComplete="off" />
            </div>
          </Labeled>
          {instagram ? (
            <Labeled label="שם משתמש באינסטגרם">
              <div className="relative">
                <AtSign aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-crm-muted" />
                <input
                  name="instagram"
                  required
                  dir="ltr"
                  placeholder="dana.cohen"
                  className={cn(fieldClass, "pe-12 text-end")}
                  aria-label="שם משתמש באינסטגרם"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
              <p className="px-2 text-[11.5px] leading-snug text-crm-muted">בלי הקישור: רק מה שאחרי ה-@. לפי השם הזה הסוכן יזהה אותו כשיכתוב.</p>
            </Labeled>
          ) : null}
          <Labeled label="טלפון" optional={instagram}>
            <div className="relative">
              <Phone aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-crm-muted" />
              <input name="phone" required={!instagram} type="tel" inputMode="tel" dir="ltr" placeholder="050-000-0000" className={cn(fieldClass, "pe-12 text-end")} aria-label="טלפון" />
            </div>
          </Labeled>
          <Labeled label="מתעניין ב" optional>
            <Select
              name="item"
              label="מתעניין ב"
              placeholder="בחירה מהרשימה"
              options={[{ value: "", label: "בלי העדפה" }, ...items.map((item) => ({ value: item.id, label: item.title }))]}
            />
          </Labeled>
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-[13px] text-[#b3261e]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={cn(primaryButtonClass, "mt-6 w-full")}>
          <UserPlus className="size-[18px]" aria-hidden />
          {pending ? "שומר…" : "הוספת ליד"}
        </button>
      </form>
    </Modal>
  )
}
