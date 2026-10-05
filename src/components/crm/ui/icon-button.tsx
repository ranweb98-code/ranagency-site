import type { ButtonHTMLAttributes, Ref } from "react"

import { cn } from "@/lib/utils"

const SIZES = { sm: "size-8", md: "size-10", lg: "size-11" } as const
const TONES = {
  glass: "bg-black/[0.06] text-crm-ink hover:bg-black/[0.11]",
  white: "bg-white text-crm-ink hover:bg-white/80",
  ink: "bg-crm-ink text-white hover:bg-crm-ink/85",
  /** For sitting on a solid colour card. */
  onColor: "border border-white/45 text-inherit hover:bg-white/15",
  onLight: "border border-black/15 text-inherit hover:bg-black/[0.06]",
} as const

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>
  /** Required — these are icon-only, so the label is the accessible name. */
  label: string
  size?: keyof typeof SIZES
  tone?: keyof typeof TONES
}

export function IconButton({ label, size = "md", tone = "glass", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink disabled:opacity-40 [&_svg]:size-[45%]",
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
