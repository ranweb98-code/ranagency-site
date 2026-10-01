import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/** The frosted card every CRM surface is built from. */
export function Glass({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("crm-glass min-w-0 rounded-[28px] md:rounded-[34px]", className)}
      {...props}
    />
  )
}
