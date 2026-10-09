"use client"

import { Bell, CalendarCheck, Hand, Info, UserPlus, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

import { IconButton } from "@/components/crm/ui/icon-button"
import { formatRelative } from "@/lib/crm/format"
import { noticeHref, unreadCount, type NotificationFeed, type NotificationKind } from "@/lib/crm/notifications"
import { cn } from "@/lib/utils"

const KIND: Record<NotificationKind, { icon: LucideIcon; label: string }> = {
  lead_new: { icon: UserPlus, label: "ליד חדש" },
  appointment: { icon: CalendarCheck, label: "תור" },
  needs_human: { icon: Hand, label: "הסוכן צריך אתכם" },
  info: { icon: Info, label: "עדכון" },
}

/** The bell. A real workspace marks things as seen on the server (so the count
 *  follows you to your phone); the demo just remembers for the visit. */
export function NotificationsMenu({
  feed,
  base,
  markSeen,
  sendTest,
}: {
  feed: NotificationFeed
  base: string
  markSeen?: () => Promise<unknown>
  /** Super admin only: adds a sample notification and emails it to them. */
  sendTest?: () => Promise<{ ok: true; emailed: boolean } | { ok: false; error: string }>
}) {
  const id = useId()
  const wrapper = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [seenAt, setSeenAt] = useState(feed.seenAt)
  // What was unread when the panel opened stays highlighted until it closes,
  // even though opening it already cleared the badge.
  const [highlightFrom, setHighlightFrom] = useState<string | null>(null)
  const [openedAt, setOpenedAt] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  const unread = unreadCount(feed, seenAt)

  const toggle = () => {
    if (open) return setOpen(false)
    setHighlightFrom(seenAt)
    setOpenedAt(new Date().toISOString())
    setOpen(true)
    if (unread > 0) {
      setSeenAt(new Date().toISOString())
      void markSeen?.()
    }
  }

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const runTest = async () => {
    if (!sendTest) return
    setStatus("שולחים…")
    const result = await sendTest()
    setStatus(result.ok ? (result.emailed ? "נוספה התראה ונשלח אליכם מייל. רעננו את הדף כדי לראות אותה." : "נוספה התראה. המייל לא נשלח (אין מפתח Resend). רעננו את הדף.") : result.error)
  }

  const cutoff = highlightFrom ? Date.parse(highlightFrom) : 0
  const urgentOpen = feed.items.some((n) => n.urgent && Date.parse(n.at) > (seenAt ? Date.parse(seenAt) : 0))

  return (
    <div ref={wrapper} className="relative">
      <IconButton label={unread ? `התראות, ${unread} חדשות` : "התראות"} tone="white" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>
        <Bell />
        {unread ? (
          <span className={cn("absolute -end-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold leading-[18px] text-white ring-2 ring-white", urgentOpen ? "bg-[#ff4d2e]" : "bg-crm-accent")}>{unread > 9 ? "9+" : unread}</span>
        ) : null}
      </IconButton>

      {open ? (
        <div id={id} role="dialog" aria-label="התראות" className="crm-menu crm-pop fixed inset-x-3 top-20 z-[200] max-h-[70dvh] overflow-y-auto rounded-[28px] p-2 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[380px]">
          <h2 className="px-3 pb-1.5 pt-2 text-[13px] font-medium text-crm-muted">התראות</h2>
          {feed.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-relaxed text-crm-muted">
              אין התראות עדיין.
              <br />
              כשיגיע ליד חדש, ייקבע תור או שהסוכן יצטרך אתכם, זה יופיע כאן.
            </p>
          ) : (
            <ul>
              {feed.items.map((n) => {
                const { icon: Icon, label } = KIND[n.kind]
                const fresh = Date.parse(n.at) > cutoff
                return (
                  <li key={n.id}>
                    <Link href={noticeHref(base, n)} onClick={() => setOpen(false)} className={cn("flex items-start gap-3 rounded-[22px] p-3 transition-colors hover:bg-black/[0.06] focus-visible:bg-black/[0.06] focus-visible:outline-none", fresh && "bg-black/[0.04]")}>
                      <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", n.urgent ? "bg-[#ff4d2e] text-white" : "bg-crm-ink text-white")}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("text-[11px] font-medium", n.urgent ? "text-[#d6391d]" : "text-crm-muted")}>{label}</span>
                          <span className="shrink-0 text-[10.5px] text-crm-muted">{formatRelative(n.at, openedAt)}</span>
                        </span>
                        <span className={cn("mt-0.5 block text-[13.5px] leading-snug", fresh ? "font-semibold" : "font-medium")}>{n.title}</span>
                        {n.body ? <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-crm-muted">{n.body}</span> : null}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {sendTest ? (
            <div className="mt-1 border-t border-black/[0.06] px-2 pt-2">
              <button type="button" onClick={runTest} className="w-full rounded-full px-3 py-2 text-start text-[12px] font-medium text-crm-ink/75 transition-colors hover:bg-black/[0.06]">
                שליחת התראת בדיקה (למנהל בלבד)
              </button>
              {status ? <p className="px-3 pb-2 text-[11px] leading-relaxed text-crm-muted">{status}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
