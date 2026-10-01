import { Ellipsis, Maximize2 } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Glass } from "./glass"
import { IconButton } from "./icon-button"

/** A glass card with the title row used all over the dashboard. */
export function SectionCard({
  title,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title: string
  /** Replaces the default menu + expand pair. */
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  return (
    <Glass className={cn("flex flex-col p-4 md:p-5", className)}>
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-medium">{title}</h2>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <IconButton label="עוד אפשרויות" size="sm">
                <Ellipsis />
              </IconButton>
              <IconButton label="הרחבה" size="sm">
                <Maximize2 />
              </IconButton>
            </>
          )}
        </div>
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </Glass>
  )
}
