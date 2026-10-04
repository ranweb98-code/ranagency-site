"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

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

export interface LeadInput {
  name: string
  phone: string
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
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createLead) {
      // Demo build: the toast says so rather than pretending the lead exists.
      toast("בגרסת ההדגמה הליד לא נשמר. עם חיבור למסד הנתונים הוא יופיע כאן.")
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
      <form onSubmit={submit} className="crm-panel rounded-t-[32px] p-6 md:rounded-[32px]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium">ליד חדש</h2>
          <IconButton label="סגירה" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="space-y-3">
          <input name="name" required placeholder={`שם ${personLabel}`} className={fieldClass} aria-label="שם" autoComplete="off" />
          <input name="phone" required type="tel" inputMode="tel" dir="ltr" placeholder="050-000-0000" className={cn(fieldClass, "text-end")} aria-label="טלפון" />
          <Select
            name="item"
            label="מתעניין ב"
            placeholder="מתעניין ב… (לא חובה)"
            options={[{ value: "", label: "בלי העדפה" }, ...items.map((item) => ({ value: item.id, label: item.title }))]}
          />
          <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label="מקור">
            {SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={source === s}
                onClick={() => setSource(s)}
                className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors", source === s ? "bg-crm-ink text-white" : "bg-black/[0.07] text-crm-ink/70")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-4 text-[13px] text-[#b3261e]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={cn(primaryButtonClass, "mt-6 w-full")}>
          {pending ? "שומר…" : "הוספה"}
        </button>
      </form>
    </Modal>
  )
}
