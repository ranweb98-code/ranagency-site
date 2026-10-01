import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Pill } from "./pill"

/** Header KPI: round glass icon, a big figure, a delta pill, a two-line label. */
export function StatTile({
  icon: Icon,
  value,
  label,
  badge,
  badgeTone = "warm",
}: {
  icon: LucideIcon
  value: ReactNode
  label: string
  badge?: ReactNode
  badgeTone?: "warm" | "accent" | "soft"
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="crm-glass-soft grid size-11 shrink-0 place-items-center rounded-full">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-medium leading-none tabular-nums tracking-tight">{value}</span>
          {badge ? <Pill tone={badgeTone}>{badge}</Pill> : null}
        </div>
        <p className="mt-1 whitespace-pre-line text-[11px] leading-tight text-crm-muted">{label}</p>
      </div>
    </div>
  )
}
