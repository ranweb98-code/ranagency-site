"use client"

import { Ellipsis } from "lucide-react"
import Link from "next/link"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"

import { IconButton } from "./icon-button"

export interface MenuItem {
  label: string
  href: string
}

interface Placement {
  left: number
  top?: number
  bottom?: number
}

const WIDTH = 224

/**
 * The "more" menu on a card: a few links to the screens that card is a window
 * into. Same rounded, opaque list as the Select, portalled out of the card so
 * it is never clipped, and operable from the keyboard.
 */
export function PopoverMenu({ items, label = "עוד אפשרויות" }: { items: MenuItem[]; label?: string }) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const show = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    const downward = below >= items.length * 44 + 24 || below >= rect.top
    setHost(trigger.closest("dialog") ?? trigger.closest<HTMLElement>(".crm-root") ?? document.body)
    setPlacement({
      left: Math.min(Math.max(rect.left, 8), Math.max(8, window.innerWidth - WIDTH - 8)),
      ...(downward ? { top: rect.bottom + 8 } : { bottom: window.innerHeight - rect.top + 8 }),
    })
    setOpen(true)
  }

  const hide = (refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector("a")?.focus()
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

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const links = [...event.currentTarget.querySelectorAll("a")]
    const index = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const next = event.key === "ArrowDown" ? Math.min(links.length - 1, index + 1) : Math.max(0, index - 1)
      links[next]?.focus()
    } else if (event.key === "Escape") {
      event.preventDefault()
      hide(true)
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <>
      <IconButton
        ref={triggerRef}
        label={label}
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? hide(false) : show())}
      >
        <Ellipsis />
      </IconButton>
      {open && host && placement
        ? createPortal(
            <ul
              ref={listRef}
              id={`${id}-menu`}
              role="menu"
              aria-label={label}
              onKeyDown={onKeyDown}
              style={{ left: placement.left, top: placement.top, bottom: placement.bottom, width: WIDTH }}
              className="crm-menu crm-pop fixed z-[200] rounded-[26px] p-1.5"
            >
              {items.map((item) => (
                <li key={item.href} role="none">
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block truncate rounded-full px-4 py-2.5 text-[14px] transition-colors hover:bg-black/[0.07] focus-visible:bg-black/[0.07] focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>,
            host,
          )
        : null}
    </>
  )
}
