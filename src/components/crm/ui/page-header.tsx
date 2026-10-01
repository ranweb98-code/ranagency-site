import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { IconButton } from "./icon-button"

/** Big page title (with an optional back circle) and a slot for header KPIs. */
export function PageHeader({
  title,
  eyebrow,
  backHref,
  children,
}: {
  title: string
  eyebrow?: string
  backHref?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 pb-5 pt-1 md:flex-row md:items-center md:justify-between md:gap-8 md:pb-7">
      <div className="flex items-center gap-4">
        {backHref ? (
          <Link href={backHref} aria-label="חזרה" className="shrink-0">
            <IconButton label="חזרה" tone="glass" size="lg" tabIndex={-1} className="pointer-events-none">
              <ArrowRight />
            </IconButton>
          </Link>
        ) : null}
        <div>
          {eyebrow ? <p className="mb-1.5 text-xs text-crm-muted">{eyebrow}</p> : null}
          <h1 className="text-[34px] font-medium leading-[1.05] tracking-tight md:text-[44px]">{title}</h1>
        </div>
      </div>
      {children ? <div className="crm-hide-scrollbar -mx-3 flex gap-6 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 md:gap-8 md:pb-0">{children}</div> : null}
    </div>
  )
}
