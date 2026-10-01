"use client"

import { CornerDownLeft, Plus, Search, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { Modal } from "@/components/crm/ui/modal"
import { cn } from "@/lib/utils"

interface Entry {
  key: string
  label: string
  hint: string
  href?: string
  action?: () => void
  icon?: LucideIcon
  person?: string
}

/** ⌘K — jump to any screen or any person without leaving the keyboard. */
export function CommandPalette({
  open,
  onClose,
  base,
  nav,
  people,
  onNewLead,
}: {
  open: boolean
  onClose: () => void
  base: string
  nav: { key: string; href: string; label: string; icon: LucideIcon }[]
  people: { id: string; name: string; phone: string }[]
  onNewLead: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} label="חיפוש מהיר" className="md:!mt-[12vh] md:!mb-auto">
      <PaletteBody base={base} nav={nav} people={people} onNewLead={onNewLead} onClose={onClose} />
    </Modal>
  )
}

function PaletteBody({
  base,
  nav,
  people,
  onNewLead,
  onClose,
}: {
  base: string
  nav: { key: string; href: string; label: string; icon: LucideIcon }[]
  people: { id: string; name: string; phone: string }[]
  onNewLead: () => void
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase()
    const screens: Entry[] = [
      { key: "new", label: "הוספת ליד חדש", hint: "פעולה", action: onNewLead, icon: Plus },
      ...nav.map((n) => ({ key: n.key, label: n.label, hint: "מסך", href: n.href, icon: n.icon })),
    ]
    const contacts: Entry[] = people.map((p) => ({
      key: p.id,
      label: p.name,
      hint: p.phone,
      href: `${base}/contacts/${p.id}`,
      person: p.name,
    }))
    const all = [...screens, ...contacts]
    return q ? all.filter((e) => e.label.toLowerCase().includes(q) || e.hint.replace(/-/g, "").includes(q.replace(/-/g, ""))) : all.slice(0, 9)
  }, [query, nav, people, base, onNewLead])

  const run = (entry: Entry | undefined) => {
    if (!entry) return
    if (entry.action) return entry.action()
    if (entry.href) {
      onClose()
      router.push(entry.href)
    }
  }

  return (
    <div className="crm-panel overflow-hidden rounded-[28px]">
      <div className="flex items-center gap-3 border-b border-black/8 px-5 py-4">
        <Search className="size-4 text-crm-muted" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setCursor((c) => Math.min(c + 1, entries.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setCursor((c) => Math.max(c - 1, 0))
            } else if (e.key === "Enter") {
              run(entries[cursor])
            }
          }}
          placeholder="חיפוש מסך, שם או טלפון…"
          aria-label="חיפוש"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-crm-muted"
        />
        <kbd className="hidden rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[10px] text-crm-muted sm:block">Esc</kbd>
      </div>
      <ul role="listbox" className="crm-scroll max-h-[50vh] overflow-y-auto p-2">
        {entries.length === 0 ? <li className="px-4 py-8 text-center text-sm text-crm-muted">לא נמצאו תוצאות</li> : null}
        {entries.map((entry, i) => {
          const Icon = entry.icon
          return (
            <li key={entry.key} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => run(entry)}
                className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm", i === cursor && "bg-black/[0.06]")}
              >
                {entry.person ? (
                  <Avatar name={entry.person} size="sm" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-black/[0.06]">{Icon ? <Icon className="size-4" aria-hidden /> : null}</span>
                )}
                <span className="flex-1 font-medium">{entry.label}</span>
                <span className="text-xs text-crm-muted" dir={entry.person ? "ltr" : undefined}>
                  {entry.hint}
                </span>
                {i === cursor ? <CornerDownLeft className="size-3.5 text-crm-muted rtl:-scale-x-100" aria-hidden /> : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
