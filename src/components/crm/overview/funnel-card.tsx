"use client"

import { ArrowUpLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Segmented } from "@/components/crm/ui/segmented"
import { SectionCard } from "@/components/crm/ui/section-card"
import { formatMoney, formatMoneyCompact } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"

type Mode = "weighted" | "total"

export function FunnelCard({ metrics, base, peopleLabel, className }: { metrics: Metrics; base: string; peopleLabel: string; className?: string }) {
  const [mode, setMode] = useState<Mode>("weighted")
  const rows = metrics.funnel
  const headline = mode === "weighted" ? metrics.pipelineWeighted : metrics.pipelineTotal

  return (
    <SectionCard
      title="משפך מכירות"
      className={className}
      menu={[
        { label: "צינור המכירות", href: `${base}/pipeline` },
        { label: `${peopleLabel} חמים`, href: `${base}/contacts?temp=hot` },
      ]}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[22px] font-medium leading-none tabular-nums">{formatMoney(headline)}</p>
          <p className="mt-1 text-[11px] text-crm-muted">{mode === "weighted" ? "צפי משוקלל בצינור" : "סך הערך בצינור"} · הערכה</p>
        </div>
        <Segmented<Mode>
          label="תצוגת משפך"
          value={mode}
          onChange={setMode}
          options={[
            { value: "weighted", label: "משוקלל" },
            { value: "total", label: "סך הכול" },
          ]}
        />
      </div>

      <ol className="flex flex-col items-center gap-2">
        {rows.map((row, i) => {
          const amount = mode === "weighted" ? row.weighted : row.total
          // A funnel silhouette: each step narrower than the last. The figure
          // inside is the data; the width is only shape.
          const shell = 100 - i * (rows.length > 1 ? 38 / (rows.length - 1) : 0)
          return (
            <li key={row.stage.id} style={{ width: `${shell}%` }} className="relative overflow-hidden rounded-[20px] bg-black/[0.055]">
              <div className="relative flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-crm-muted">
                    {row.stage.label} · {row.count}
                  </p>
                  <p className="text-[17px] font-medium leading-tight tabular-nums">{formatMoneyCompact(amount)}</p>
                </div>
                <Link
                  href={`${base}/contacts?stage=${row.stage.id}`}
                  aria-label={`הצגת ${peopleLabel} בשלב ${row.stage.label}`}
                  title={`הצגת ${peopleLabel} בשלב ${row.stage.label}`}
                  className="relative inline-grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.06] transition-colors hover:bg-black/[0.11] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"
                >
                  <ArrowUpLeft className="size-[45%]" aria-hidden />
                </Link>
              </div>
            </li>
          )
        })}
      </ol>
    </SectionCard>
  )
}
