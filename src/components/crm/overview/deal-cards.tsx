"use client"

import { ArrowUpLeft } from "lucide-react"
import Link from "next/link"

import { AvatarStack } from "@/components/crm/ui/avatar"
import { ChannelDot } from "@/components/crm/ui/channel"
import { formatDateLabel, formatMoney } from "@/lib/crm/format"
import type { Contact, CatalogItem, Stage } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

// Same five-colour rhythm as the reference: three saturated brand cards, one
// ink, one yellow, then quiet glass for the older ones. Colour carries rank,
// not category, so the newest money is always the loudest.
const TONES = [
  { surface: "bg-crm-accent text-white", muted: "text-white/75", ring: "ring-crm-accent" },
  { surface: "bg-crm-accent-2 text-white", muted: "text-white/75", ring: "ring-crm-accent-2" },
  { surface: "bg-crm-ink text-white", muted: "text-white/65", ring: "ring-crm-ink" },
  { surface: "bg-crm-warm text-crm-ink", muted: "text-crm-ink/65", ring: "ring-crm-warm" },
  { surface: "crm-glass-soft text-crm-ink", muted: "text-crm-muted", ring: "ring-white" },
  { surface: "crm-glass-soft text-crm-ink", muted: "text-crm-muted", ring: "ring-white" },
] as const

export function DealCards({
  deals,
  catalog,
  stages,
  detailBase,
  selectedId,
  onSelect,
}: {
  deals: Contact[]
  catalog: CatalogItem[]
  stages: Stage[]
  detailBase: string
  selectedId: string
  onSelect: (id: string) => void
}) {
  const itemById = new Map(catalog.map((c) => [c.id, c]))

  return (
    <ul className="crm-hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0">
      {deals.map((deal, i) => {
        const tone = TONES[i] ?? TONES[5]
        const item = itemById.get(deal.itemId)
        const selected = deal.id === selectedId
        const solid = i < 4
        return (
          <li key={deal.id} className="w-[64%] shrink-0 snap-start sm:w-[44%] md:w-auto">
            <div
              className={cn(
                "relative flex h-[122px] flex-col justify-between overflow-hidden rounded-[26px] p-4 transition-all duration-300 md:h-[128px]",
                tone.surface,
                selected ? `scale-[1.02] shadow-xl ring-2 ring-offset-2 ring-offset-transparent ${tone.ring}` : "hover:-translate-y-0.5",
              )}
            >
              <button
                type="button"
                aria-label={`${deal.name} — ${item?.title ?? ""}`}
                aria-pressed={selected}
                onClick={() => onSelect(deal.id)}
                className="absolute inset-0 z-0 rounded-[26px] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
              />
              <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("text-[11px]", tone.muted)}>
                    {formatDateLabel(deal.closedAt ?? deal.lastContactAt)} · {stages.find((s) => s.id === deal.stageId)?.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug">{item?.title ?? deal.summary}</p>
                </div>
                <span className="size-9 shrink-0" aria-hidden />
              </div>
              <div className="pointer-events-none relative z-10 flex items-end justify-between gap-2">
                <p className={cn("text-[22px] font-semibold leading-none tracking-tight tabular-nums", !solid && "text-crm-ink/55")}>
                  {formatMoney(deal.value)}
                </p>
                <span className="flex items-center gap-1.5">
                  <AvatarStack names={[deal.name]} size="xs" ring={i === 2 ? "ring-crm-ink" : "ring-white/90"} />
                  <ChannelDot channel={deal.channel} className="size-5 [&_svg]:size-3" />
                </span>
              </div>
              <Link
                href={`${detailBase}/${deal.id}`}
                aria-label={`פתיחת הכרטיס של ${deal.name}`}
                className={cn(
                  "absolute end-3 top-3 z-20 grid size-9 place-items-center rounded-full transition-colors",
                  i === 2 ? "bg-white text-crm-ink hover:bg-white/85" : solid ? "border border-white/45 hover:bg-white/15" : "bg-black/[0.06] hover:bg-black/10",
                  i === 3 && "border-black/20 hover:bg-black/10",
                )}
              >
                <ArrowUpLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
