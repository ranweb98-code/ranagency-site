"use client"

import { cn } from "@/lib/utils"

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-crm-ink" : "bg-black/20")}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-300", checked ? "end-1" : "end-6")} />
    </button>
  )
}
