"use client"

import { Archive, ArchiveRestore, Trash2, X } from "lucide-react"
import { useActionState, useId, useState } from "react"

import { fieldClass } from "@/components/crm/ui/field"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Modal } from "@/components/crm/ui/modal"
import { cn } from "@/lib/utils"
import { deleteBusiness, setBusinessArchived, type AdminState } from "./actions"

const initial: AdminState = { ok: false }
const quiet =
  "flex items-center gap-1.5 rounded-full bg-black/[0.07] px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.11] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"

/** Archive (reversible) and delete (permanent, behind typing the address). */
export function ManageBusiness({ tenantId, slug, name, leads, archived }: { tenantId: string; slug: string; name: string; leads: number; archived: boolean }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [state, action, pending] = useActionState(deleteBusiness, initial)
  const id = useId()
  const matches = typed.trim().toLowerCase() === slug

  const close = () => {
    setOpen(false)
    setTyped("")
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
      <form action={setBusinessArchived}>
        <input type="hidden" name="id" value={tenantId} />
        <input type="hidden" name="archive" value={archived ? "0" : "1"} />
        <button type="submit" className={quiet}>
          {archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
          {archived ? "שחזור מהארכיון" : "העברה לארכיון"}
        </button>
      </form>
      <button type="button" onClick={() => setOpen(true)} className={cn(quiet, "text-[#b3261e]")}>
        <Trash2 className="size-4" aria-hidden />
        מחיקה
      </button>

      <Modal open={open} onClose={close} label={`מחיקת ${name}`}>
        <form action={action} className="crm-panel rounded-[32px] p-6">
          <input type="hidden" name="tenant_id" value={tenantId} />
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-medium">למחוק את ״{name}״?</h2>
            <IconButton label="סגירה" size="sm" onClick={close}>
              <X />
            </IconButton>
          </div>
          <p className="text-[14px] leading-relaxed text-crm-ink/80">
            המחיקה סופית ואי אפשר לשחזר אותה. יימחקו העסק, {leads} {leads === 1 ? "ליד" : "לידים"} עם השיחות שלהם, הקטלוג, התמונות, המשתמשים וההזמנות הפתוחות. אם אתם רק רוצים להסתיר אותו, העבירו לארכיון במקום.
          </p>
          <label htmlFor={id} className="mt-5 block px-1 text-[13px] text-crm-ink/80">
            לאישור כתבו את כתובת העסק: <bdi dir="ltr" className="font-medium text-crm-ink">{slug}</bdi>
          </label>
          <input
            id={id}
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            dir="ltr"
            autoComplete="off"
            className={cn(fieldClass, "mt-2 text-end")}
          />
          {state.error ? (
            <p role="alert" className="mt-3 text-[13px] text-[#b3261e]">
              {state.error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={close} className={quiet}>
              ביטול
            </button>
            <button
              type="submit"
              disabled={!matches || pending}
              className="flex items-center gap-2 rounded-full bg-[#b3261e] px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3261e] disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden />
              {pending ? "מוחק…" : "מחיקה לצמיתות"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
