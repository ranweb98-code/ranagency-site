"use client"

import { X } from "lucide-react"
import { useState, type FormEvent } from "react"

import { IconButton } from "@/components/crm/ui/icon-button"
import { Modal } from "@/components/crm/ui/modal"
import { cn } from "@/lib/utils"
import { useToast } from "./toast"

const SOURCES = ["וואטסאפ", "אינסטגרם", "טלפון", "הגיע ישירות"]

const field =
  "w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-crm-muted focus:border-crm-ink/40 focus:bg-white"

/** Manual lead entry — for the walk-in or the phone call no agent took. */
export function NewLeadDialog({
  open,
  onClose,
  personLabel,
  items,
}: {
  open: boolean
  onClose: () => void
  personLabel: string
  items: { id: string; title: string }[]
}) {
  const toast = useToast()
  const [source, setSource] = useState(SOURCES[0])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Demo build: nothing is persisted yet. The toast says so rather than
    // pretending the lead exists.
    toast("בגרסת ההדגמה הליד לא נשמר. עם חיבור למסד הנתונים הוא יופיע כאן.")
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} label="הוספת ליד" variant="bottom" className="md:!fixed md:!inset-0 md:!m-auto md:!h-fit md:!w-[min(92vw,30rem)]">
      <form onSubmit={submit} className="crm-panel rounded-t-[32px] p-6 backdrop-blur-2xl md:rounded-[32px]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium">ליד חדש</h2>
          <IconButton label="סגירה" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="space-y-3">
          <input name="name" required placeholder={`שם ${personLabel}`} className={field} aria-label="שם" autoComplete="off" />
          <input name="phone" required type="tel" inputMode="tel" dir="ltr" placeholder="050-000-0000" className={cn(field, "text-end")} aria-label="טלפון" />
          <select name="item" className={field} aria-label="מתעניין ב" defaultValue="">
            <option value="">מתעניין ב… (לא חובה)</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
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
        <button type="submit" className="mt-6 w-full rounded-full bg-crm-ink py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90">
          הוספה
        </button>
      </form>
    </Modal>
  )
}
