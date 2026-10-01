import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

const TONES = {
  warm: "bg-crm-warm text-crm-ink",
  accent: "bg-crm-accent text-white",
  ink: "bg-crm-ink text-white",
  soft: "bg-black/[0.07] text-crm-ink/70",
  white: "bg-white/80 text-crm-ink",
  onColor: "bg-white/20 text-inherit",
} as const

export function Pill({
  tone = "soft",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium leading-4",
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
