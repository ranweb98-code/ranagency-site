"use client"

import { Building2, LayoutList, LogOut, UserRound, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"

import { Avatar } from "@/components/crm/ui/avatar"

interface Placement {
  left: number
  top: number
}

const WIDTH = 288

const itemClass =
  "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-start text-[14px] transition-colors hover:bg-black/[0.07] focus-visible:bg-black/[0.07] focus-visible:outline-none"

/** The person's own corner of the header: their photo opens who they are signed
 *  in as and the ways out (their profile, the business, the admin list, sign out). */
export function AccountMenu({
  name,
  email,
  subtitle,
  avatarUrl,
  accountHref,
  businessHref,
  adminHref,
  signOut,
}: {
  name: string
  email: string
  subtitle?: string | null
  avatarUrl?: string | null
  accountHref: string
  businessHref: string
  adminHref?: string
  signOut: () => Promise<void>
}) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const show = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setHost(trigger.closest<HTMLElement>(".crm-root") ?? document.body)
    setPlacement({ left: Math.min(Math.max(rect.left, 8), Math.max(8, window.innerWidth - WIDTH - 8)), top: rect.bottom + 8 })
    setOpen(true)
  }

  const hide = (refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener("pointerdown", outside)
    window.addEventListener("resize", close)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", outside)
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", close, true)
    }
  }, [open])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]")]
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const next = event.key === "ArrowDown" ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1)
      items[next]?.focus()
    } else if (event.key === "Escape") {
      event.preventDefault()
      hide(true)
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  const link = (href: string, label: string, Icon: LucideIcon) => (
    <Link href={href} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
      <Icon className="size-4 shrink-0 text-crm-ink/60" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`החשבון של ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? hide(false) : show())}
        className="shrink-0 rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"
      >
        <Avatar name={name} src={avatarUrl} size="md" decorative className="ring-2 ring-white/90" />
      </button>

      {open && host && placement
        ? createPortal(
            <div
              ref={listRef}
              id={`${id}-menu`}
              role="menu"
              aria-label="החשבון שלי"
              onKeyDown={onKeyDown}
              style={{ left: placement.left, top: placement.top, width: WIDTH }}
              className="crm-menu crm-pop fixed z-[200] rounded-[26px] p-1.5"
            >
              <div role="presentation" className="flex items-center gap-3 px-3 pb-3 pt-2.5">
                <Avatar name={name} src={avatarUrl} size="lg" decorative />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{name}</p>
                  {subtitle ? <p className="truncate text-[12px] text-crm-ink/60">{subtitle}</p> : null}
                  <bdi dir="ltr" className="block truncate text-start text-[12px] text-crm-ink/60">
                    {email}
                  </bdi>
                </div>
              </div>
              <div role="separator" className="mx-3 mb-1.5 h-px bg-black/10" />
              {link(accountHref, "הפרופיל שלי", UserRound)}
              {link(businessHref, "פרופיל העסק", Building2)}
              {adminHref ? link(adminHref, "כל העסקים", LayoutList) : null}
              <div role="separator" className="mx-3 my-1.5 h-px bg-black/10" />
              <form action={signOut}>
                <button type="submit" role="menuitem" className={itemClass}>
                  <LogOut className="size-4 shrink-0 text-crm-ink/60" aria-hidden />
                  יציאה
                </button>
              </form>
            </div>,
            host,
          )
        : null}
    </>
  )
}
