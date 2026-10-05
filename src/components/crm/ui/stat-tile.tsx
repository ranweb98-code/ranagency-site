import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Pill } from "./pill"

/** Header KPI: round glass icon, a big figure, a delta pill, a two-line label. */
export function StatTile({
  icon: Icon,
  value,
  label,
  badge,
  badgeTone = "warm",
  href,
  onClick,
}: {
  icon: LucideIcon
  value: ReactNode
  label: string
  badge?: ReactNode
  badgeTone?: "warm" | "accent" | "soft"
  /** Makes the whole tile a link to the screen the figure comes from. */
  href?: string
  /** …or a button, when the figure is a filter on the page it sits on. */
  onClick?: () => void
}) {
  const interactive = Boolean(href || onClick)
  const body = (
    <>
      <span className={cn("crm-glass-soft grid size-11 shrink-0 place-items-center rounded-full transition-colors", interactive && "group-hover:bg-white/80")}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-medium leading-none tabular-nums tracking-tight">{value}</span>
          {badge ? <Pill tone={badgeTone}>{badge}</Pill> : null}
        </div>
        <p className="mt-1 whitespace-pre-line text-[11px] leading-tight text-crm-muted">{label}</p>
      </div>
    </>
  )

  const ring = "group flex items-center gap-3 rounded-full text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crm-ink"
  if (href) return <Link href={href} className={ring}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={ring}>{body}</button>
  return <div className="flex items-center gap-3">{body}</div>
}
