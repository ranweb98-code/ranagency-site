import { Bot, CalendarCheck, Camera, CircleDollarSign, Sparkles, Zap, type LucideIcon } from "lucide-react"

import { formatRelative } from "@/lib/crm/format"
import type { TimelineEvent } from "@/lib/crm/types"

const ICON: Record<TimelineEvent["kind"], LucideIcon> = {
  lead: Zap,
  agent: Bot,
  stage: Sparkles,
  media: Camera,
  appointment: CalendarCheck,
  money: CircleDollarSign,
}

export function Timeline({ events, now }: { events: TimelineEvent[]; now: string }) {
  return (
    <ol className="relative space-y-3.5 border-s border-black/10 ps-4">
      {events.map((event) => {
        const Icon = ICON[event.kind]
        return (
          <li key={event.id} className="relative">
            <span className="absolute -start-[25px] top-0.5 grid size-5 place-items-center rounded-full bg-white shadow-sm">
              <Icon className="size-3" aria-hidden />
            </span>
            <p className="text-xs leading-snug">{event.text}</p>
            <p className="mt-0.5 text-[10.5px] text-crm-muted">{formatRelative(event.at, now)}</p>
          </li>
        )
      })}
    </ol>
  )
}
