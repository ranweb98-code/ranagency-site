"use client"

import { useId, useMemo, useState, type KeyboardEvent } from "react"

import { Ltr } from "@/components/crm/ui/ltr"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Segmented } from "@/components/crm/ui/segmented"
import { formatMoney, formatMoneyCompact } from "@/lib/crm/format"
import { REVENUE_RANGES, niceScale, revenueSeries, shortDay, type RevenueBucket, type RevenueRange, type RevenueSeries } from "@/lib/crm/revenue"
import type { CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

const PLOT = "h-[168px] md:h-[200px]"
/** A jump of more than 5× is a comparison with an almost empty period, not news worth a badge. */
const DELTA_CEILING = 500
const MONTH_LONG = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" })
const WEEKDAY = new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" })
const dayAsDate = (day: string) => new Date(`${day}T00:00:00Z`)

/** Axis numbers carry no currency sign: the figure above them says ₪. */
const tick = (value: number) => (value === 0 ? "0" : value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : String(value))

function describe(bucket: RevenueBucket, kind: RevenueSeries["kind"]): string {
  if (kind === "day") return `${WEEKDAY.format(dayAsDate(bucket.from))}, ${shortDay(bucket.from)}`
  if (kind === "week") return `${shortDay(bucket.from)} עד ${shortDay(bucket.to)}`
  return bucket.partial ? `${MONTH_LONG.format(dayAsDate(bucket.from))} (עד היום)` : MONTH_LONG.format(dayAsDate(bucket.from))
}

const deals = (n: number) => (n === 0 ? "אין עסקאות" : n === 1 ? "עסקה אחת" : `${n} עסקאות`)

/** Closed revenue over time: one column per day, week or month. The newest
 *  column is the accent colour and the rest are its tint, so the eye lands on
 *  "now" and the shape of the past is still easy to read. */
export function RevenueCard({ data, className, base }: { data: CrmData; className?: string; base: string }) {
  const [range, setRange] = useState<RevenueRange>("12w")
  const series = useMemo(() => revenueSeries(data, range), [data, range])
  const { vocab } = data.pack

  return (
    <SectionCard
      title="הכנסות לאורך זמן"
      className={className}
      menu={[
        { label: "צינור המכירות", href: `${base}/pipeline` },
        { label: `כל ה${vocab.people}`, href: `${base}/contacts` },
      ]}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[32px] font-medium leading-none tracking-tight md:text-[38px]">{formatMoney(series.total)}</p>
            {series.delta !== null && series.delta <= DELTA_CEILING ? (
              <Pill tone={series.delta >= 0 ? "warm" : "soft"} aria-label={`${series.delta >= 0 ? "עלייה" : "ירידה"} של ${Math.abs(series.delta)} אחוז מול התקופה הקודמת`}>
                <Ltr>
                  {series.delta > 0 ? "+" : ""}
                  {series.delta}%
                </Ltr>{" "}
                מול הקודמת
              </Pill>
            ) : null}
          </div>
          <p className="mt-1.5 text-[12px] text-crm-muted">
            {vocab.revenue} · {deals(series.count)}
            {series.count > 0 ? ` · ממוצע ${formatMoney(series.average)} לעסקה` : ""}
          </p>
        </div>
        <Segmented<RevenueRange> label="טווח הזמן" value={range} onChange={setRange} options={REVENUE_RANGES.map((r) => ({ value: r.id, label: r.label }))} />
      </div>

      <RevenueChart series={series} emptyHint={data.demo ? undefined : `כשעסקה תסומן כנסגרה היא תופיע כאן.`} />
    </SectionCard>
  )
}

function RevenueChart({ series, emptyHint }: { series: RevenueSeries; emptyHint?: string }) {
  const id = useId()
  const [active, setActive] = useState<number | null>(null)
  const { buckets, kind } = series
  const n = buckets.length
  const scale = useMemo(() => niceScale(Math.max(0, ...buckets.map((b) => b.total))), [buckets])
  const empty = series.total === 0

  // Label roughly six places along the axis, always including the newest.
  const every = Math.ceil(n / 6)
  const labelled = (i: number) => (n - 1 - i) % every === 0

  const activeBucket = active === null ? null : buckets[active]

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // The page is right-to-left: time runs from the right (oldest) to the left (newest).
    const step = event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0
    if (step === 0) {
      if (event.key === "Escape") setActive(null)
      return
    }
    event.preventDefault()
    setActive((current) => Math.min(n - 1, Math.max(0, (current ?? n - 1) + step)))
  }

  return (
    <figure className="mt-5">
      <figcaption className="sr-only">
        הכנסות שנסגרו, {kind === "day" ? "לפי יום" : kind === "week" ? "לפי שבוע" : "לפי חודש"}. חצים ימינה ושמאלה עוברים בין התקופות.
      </figcaption>

      <div className="flex gap-2">
        {/* y axis: the numbers the gridlines stand for */}
        <div aria-hidden className={cn("relative w-8 shrink-0 text-[10.5px] text-crm-muted tabular-nums", PLOT)}>
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="absolute end-0 -translate-y-1/2 leading-none" style={{ bottom: `${(k / 3) * 100}%` }}>
              {tick(scale.step * k)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            aria-label="גרף הכנסות"
            aria-describedby={`${id}-live`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            // a finger lifting fires "leave" at once; only a mouse leaving should hide the readout
            onPointerLeave={(event) => event.pointerType !== "touch" && setActive(null)}
            className={cn("relative rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-crm-ink/25", PLOT)}
          >
            {[0, 1, 2, 3].map((k) => (
              <span key={k} aria-hidden className="absolute inset-x-0 h-px bg-black/[0.07]" style={{ bottom: `${(k / 3) * 100}%` }} />
            ))}

            <div className="absolute inset-0 flex">
              {buckets.map((bucket, i) => {
                const height = scale.top > 0 ? (bucket.total / scale.top) * 100 : 0
                const hot = active === i || (active === null && bucket.current)
                return (
                  <div key={bucket.from} className="relative flex h-full min-w-0 flex-1 items-end justify-center" onPointerEnter={() => setActive(i)} onPointerMove={() => active !== i && setActive(i)}>
                    {active === i ? <span aria-hidden className="absolute inset-y-0 inset-x-px rounded-[10px] bg-black/[0.045]" /> : null}
                    {bucket.total > 0 ? (
                      <span
                        aria-hidden
                        className="relative w-[min(60%,24px)] rounded-t-[4px] transition-[background-color] duration-150"
                        style={{
                          height: `${Math.max(height, 1.5)}%`,
                          backgroundColor: hot ? "var(--crm-accent)" : "color-mix(in oklab, var(--crm-accent) 42%, transparent)",
                        }}
                      />
                    ) : (
                      // nothing closed here: a hairline stub says "counted, and zero"
                      <span aria-hidden className="relative h-[2px] w-[min(60%,24px)] rounded-full bg-black/15" />
                    )}
                  </div>
                )
              })}
            </div>

            {activeBucket && active !== null ? <Readout bucket={activeBucket} kind={kind} index={active} count={n} /> : null}

            {empty ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <p className="max-w-[16rem] rounded-2xl bg-white/85 px-4 py-3 text-center text-[13px] leading-relaxed text-crm-ink/80">
                  אין עסקאות שנסגרו בתקופה הזו.
                  {emptyHint ? <span className="mt-0.5 block text-[12px] text-crm-muted">{emptyHint}</span> : null}
                </p>
              </div>
            ) : null}
          </div>

          {/* x axis */}
          <div aria-hidden className="mt-2 flex text-[10.5px] text-crm-muted">
            {buckets.map((bucket, i) => (
              <div key={bucket.from} className="flex min-w-0 flex-1 justify-center">
                {labelled(i) ? <span className={cn("shrink-0 whitespace-nowrap leading-none", bucket.current && "font-medium text-crm-ink")}>{bucket.label}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p id={`${id}-live`} aria-live="polite" className="sr-only">
        {activeBucket ? `${describe(activeBucket, kind)}: ${formatMoney(activeBucket.total)}, ${deals(activeBucket.count)}` : ""}
      </p>

      {/* the same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>הכנסות שנסגרו לפי תקופה</caption>
        <thead>
          <tr>
            <th scope="col">תקופה</th>
            <th scope="col">הכנסה</th>
            <th scope="col">עסקאות</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.from}>
              <th scope="row">{describe(bucket, kind)}</th>
              <td>{formatMoney(bucket.total)}</td>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {series.peak && !empty ? (
        <p className="mt-3 text-[12px] text-crm-muted">
          התקופה החזקה: {describe(series.peak, kind)} · {formatMoney(series.peak.total)}
        </p>
      ) : null}
    </figure>
  )
}

/** The tooltip: value first, then which period and how many deals. It hugs the
 *  edge on the first and last columns instead of spilling out of the card. */
function Readout({ bucket, kind, index, count }: { bucket: RevenueBucket; kind: RevenueSeries["kind"]; index: number; count: number }) {
  const at = ((index + 0.5) / count) * 100
  const nearStart = index / count < 0.22
  const nearEnd = index / count > 0.78
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-0 z-10 w-max max-w-[11rem] rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_14px_34px_-14px_rgba(24,32,64,0.4)] ring-1 ring-black/5",
        !nearStart && !nearEnd && "-translate-x-1/2 rtl:translate-x-1/2",
      )}
      style={nearStart ? { insetInlineStart: 0 } : nearEnd ? { insetInlineEnd: 0 } : { insetInlineStart: `${at}%` }}
    >
      <p className="text-[18px] font-semibold leading-tight">{formatMoneyCompact(bucket.total)}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-crm-muted">{describe(bucket, kind)}</p>
      <p className="text-[11px] leading-snug text-crm-muted">{deals(bucket.count)}</p>
    </div>
  )
}
