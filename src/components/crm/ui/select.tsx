"use client"

import { Check, ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { fieldClass } from "./field"

export interface SelectOption {
  value: string
  label: string
}

interface Placement {
  left: number
  width: number
  /** Distance from the top of the viewport, or from its bottom when it opens upward. */
  top?: number
  bottom?: number
  maxHeight: number
}

/**
 * The CRM's dropdown. The browser's own <select> opens a square, system-blue
 * list that nothing on the page can style, so this draws the same thing from
 * the same pills as the rest of the UI: a rounded trigger, a frosted panel of
 * rounded options, full keyboard support, and a hidden input so it still posts
 * with a normal <form> and server action.
 *
 * The list is portalled out of the way (into the surrounding <dialog> when
 * there is one — a dialog sits in the top layer, above anything else — and
 * otherwise into .crm-root, which is where the tenant's colours are defined),
 * so scrolling rows and clipped containers never cut it off.
 */
export function Select({
  options,
  value,
  defaultValue = "",
  onChange,
  name,
  label,
  placeholder,
  variant = "field",
  className,
  disabled,
}: {
  options: SelectOption[]
  /** Controlled value. Leave out (and use `defaultValue`) for form fields. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  name?: string
  /** Accessible name; the trigger shows only the current choice. */
  label: string
  /** Shown while the current value is the empty string. */
  placeholder?: string
  variant?: "field" | "pill"
  className?: string
  disabled?: boolean
}) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [inner, setInner] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const current = value ?? inner
  const selectedIndex = options.findIndex((o) => o.value === current)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const optionId = (index: number) => `${id}-option-${index}`

  const measure = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gap = 8
    const margin = 12
    const wanted = Math.min(options.length * 44 + 16, 320)
    const below = window.innerHeight - rect.bottom - margin
    const above = rect.top - margin
    const downward = below >= wanted || below >= above
    const width = Math.max(rect.width, variant === "pill" ? 208 : 0)
    const rtl = getComputedStyle(trigger).direction === "rtl"
    const left = Math.min(Math.max(rtl ? rect.right - width : rect.left, 8), Math.max(8, window.innerWidth - width - 8))
    setPlacement({
      left,
      width,
      maxHeight: Math.max(120, Math.min(320, (downward ? below : above) - gap)),
      ...(downward ? { top: rect.bottom + gap } : { bottom: window.innerHeight - rect.top + gap }),
    })
  }

  const show = () => {
    if (disabled) return
    setHost(triggerRef.current?.closest("dialog") ?? triggerRef.current?.closest<HTMLElement>(".crm-root") ?? document.body)
    measure()
    setActive(Math.max(0, selectedIndex))
    setOpen(true)
  }

  const hide = (refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    if (value === undefined) setInner(option.value)
    onChange?.(option.value)
    hide(true)
  }

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const reposition = () => measure()
    document.addEventListener("pointerdown", outside)
    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    return () => {
      document.removeEventListener("pointerdown", outside)
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
    }
    // measure only reads refs and props that are fixed while the list is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        if (!open) return show()
        setActive((i) => Math.min(last, Math.max(0, i + (event.key === "ArrowDown" ? 1 : -1))))
        return
      }
      case "Home":
      case "End":
        if (!open) return
        event.preventDefault()
        setActive(event.key === "Home" ? 0 : last)
        return
      case "Enter":
      case " ":
        event.preventDefault()
        return open ? choose(active) : show()
      case "Escape":
        if (!open) return
        event.preventDefault()
        return hide(true)
      case "Tab":
        if (open) setOpen(false)
        return
      default:
        // type a letter to jump to the next option that starts with it
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const letter = event.key.toLowerCase()
          const from = open ? active + 1 : selectedIndex + 1
          const hit = [...options.slice(from), ...options.slice(0, from)].find((o) => o.label.toLowerCase().startsWith(letter))
          if (hit) {
            const index = options.indexOf(hit)
            if (open) setActive(index)
            else choose(index)
          }
        }
    }
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? hide(false) : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex items-center gap-3 text-start disabled:opacity-60",
          variant === "pill"
            ? "shrink-0 rounded-full bg-black/[0.07] px-4 py-2.5 text-xs font-medium outline-none transition-colors hover:bg-black/[0.11] focus-visible:ring-2 focus-visible:ring-crm-ink/25"
            : fieldClass,
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected || (placeholder && current === "") ? "text-crm-muted" : undefined)}>
          {current === "" && placeholder ? placeholder : (selected?.label ?? placeholder ?? "")}
        </span>
        <ChevronDown className={cn("shrink-0 transition-transform duration-200", variant === "pill" ? "size-3.5" : "size-4", open && "rotate-180")} aria-hidden />
      </button>

      {open && host && placement
        ? createPortal(
            <ul
              ref={listRef}
              id={`${id}-list`}
              role="listbox"
              aria-label={label}
              onMouseDown={(event) => event.preventDefault()}
              style={{ left: placement.left, width: placement.width, top: placement.top, bottom: placement.bottom, maxHeight: placement.maxHeight }}
              className="crm-menu crm-pop crm-scroll fixed z-[200] overflow-y-auto rounded-[26px] p-1.5"
            >
              {options.map((option, index) => {
                const isSelected = option.value === current
                return (
                  <li
                    key={option.value || `empty-${index}`}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(index)}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-full px-4 py-2.5 text-[14px] transition-colors",
                      isSelected ? "bg-crm-ink text-white" : index === active ? "bg-black/[0.07]" : undefined,
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                  </li>
                )
              })}
            </ul>,
            host,
          )
        : null}
    </>
  )
}
