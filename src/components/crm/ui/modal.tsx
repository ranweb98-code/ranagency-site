"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Native <dialog> under the hood: focus trapping, Escape and the inert page
 * behind it come from the platform instead of from code we have to get right.
 * `bottom` is the phone-friendly sheet; `center` is a floating panel.
 */
export function Modal({
  open,
  onClose,
  label,
  variant = "center",
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  variant?: "center" | "bottom"
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        "m-0 max-h-none max-w-none bg-transparent p-0 text-crm-ink backdrop:bg-black/35 backdrop:backdrop-blur-sm",
        variant === "bottom"
          ? "fixed inset-x-0 bottom-0 top-auto w-full"
          : "fixed inset-0 m-auto h-fit w-[min(92vw,34rem)]",
        className,
      )}
    >
      {open ? children : null}
    </dialog>
  )
}
