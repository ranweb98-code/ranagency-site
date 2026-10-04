import { Check } from "lucide-react"
import type { InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/** A checkbox drawn as a pill: filled and ticked when chosen. The real input
 *  stays in the page (visually hidden), so forms, validation and keyboard
 *  behave as usual. */
export function ChoiceChip({ label, className, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & { label: string }) {
  return (
    <label className={cn("cursor-pointer", className)}>
      <input type="checkbox" className="peer sr-only" {...input} />
      <span className="flex items-center gap-1.5 rounded-full bg-black/[0.07] px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.11] peer-checked:bg-crm-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-crm-ink/40 peer-focus-visible:ring-offset-2 peer-checked:[&_svg]:w-3.5 peer-checked:[&_svg]:opacity-100">
        <Check className="size-3.5 w-0 opacity-0 transition-all" aria-hidden />
        {label}
      </span>
    </label>
  )
}
