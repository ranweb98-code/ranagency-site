"use client"

import { useId, useMemo, useRef } from "react"
import { motion, useInView, useScroll, useTransform, type MotionValue } from "motion/react"
import { Clock, Rocket, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { cn } from "@/lib/utils"

const START_VALUE = 1200
const END_VALUE = 98000
const MONTH_COUNT = 13

interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

const BENEFITS: Benefit[] = [
  {
    icon: Clock,
    title: "חוסכים לך זמן יקר",
    description: "מאוטמים משימות חוזרות כדי שאתם והצוות תתפנו לצמיחה של העסק",
  },
  {
    icon: TrendingUp,
    title: "מגדילים הכנסות",
    description: "אוטומציות שממירות יותר לידים, סוגרות יותר עסקאות ומגדילות את שווי הלקוח",
  },
  {
    icon: Rocket,
    title: "גדלים בלי הגבלה",
    description: "המערכות שלנו גדלות יחד עם העסק שלכם בלי לייקר את העלויות",
  },
  {
    icon: ShieldCheck,
    title: "אמינות ובטיחות",
    description: "תשתית ברמה ארגונית, עם אבטחה ואמינות מהשורה הראשונה",
  },
]

function useMonthLabels(count: number) {
  return useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }))
    }
    return months
  }, [count])
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function formatAmount(p: number) {
  // Exponent < 1 eases OUT (quick at first, gentle near the end) instead of
  // easing IN — the old 1.9 exponent made the count accelerate the closer
  // it got to the end, which read as "shooting up too fast" right before
  // the pin released.
  const eased = Math.pow(clamp01(p), 0.65)
  const value = START_VALUE + (END_VALUE - START_VALUE) * eased
  return Math.round(value).toLocaleString("en-US")
}

export function GrowthTimelineSection() {
  const pinRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  })
  // The number/month read straight off raw scrollYProgress rather than a
  // smoothed value: a spring here would still be visibly short of "done"
  // when the pin releases on a fast flick (confirmed — even a ~150ms-settle
  // spring undershot). The chart's decorative pulse is the only thing with
  // any lag tolerance, and it doesn't need scroll-derived smoothing at all
  // now — see the note on GrowthChart's own independent ping loop.
  const months = useMonthLabels(MONTH_COUNT)
  const activeIndex = useTransform(scrollYProgress, (p) => clamp01(p) * (MONTH_COUNT - 1))
  const amount = useTransform(scrollYProgress, formatAmount)

  return (
    // NOTE: no `overflow-hidden` here — it breaks `position: sticky` on the
    // pinned panel below (an ancestor with overflow other than visible
    // constrains the sticky containing block). Inner elements clip themselves.
    <section className="relative bg-ran-surface-light">
      <div ref={pinRef} className="relative h-[200vh] md:h-[280vh]">
        <div className="sticky top-0 flex h-[92dvh] items-center pt-6 md:h-[100dvh] md:pt-20">
          <SectionContainer className="w-full">
            <div dir="ltr" className="grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
              {/* animated chart — identical composition at every size, Tailwind clamp() handles scale */}
              <div className="flex justify-center md:justify-start">
                {/* Mobile: benefits carousel lives inside the sticky panel,
                    right under the chart, instead of appearing as separate
                    content once the pin released (which meant it was invisible
                    the whole time you were watching the counter, then
                    suddenly appeared the moment the pin let go). */}
                <div dir="rtl" className="flex w-full max-w-xs flex-col items-center gap-4 md:hidden">
                  <Reveal className="w-full">
                    <div className="text-center">
                      <BenefitsIntro compact />
                    </div>
                    <div className="mt-5">
                      <GrowthChart progress={scrollYProgress} activeIndex={activeIndex} amount={amount} months={months} />
                    </div>
                    <div className="mt-5">
                      <BenefitsCarousel />
                    </div>
                  </Reveal>
                </div>
                <div className="hidden md:block">
                  <GrowthChart progress={scrollYProgress} activeIndex={activeIndex} amount={amount} months={months} />
                </div>
              </div>

              {/* value proposition — desktop only here, stays fixed for the whole pin */}
              <div dir="rtl" className="hidden md:block">
                <Reveal>
                  <BenefitsPanel />
                </Reveal>
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>
    </section>
  )
}

function BenefitsPanel() {
  return (
    <div className="max-w-xl">
      <BenefitsIntro />
      <div className="mt-3">
        <BenefitsDetails />
      </div>
    </div>
  )
}

function BenefitsIntro({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className={cn("font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted", compact ? "text-[10px]" : "text-xs")}>
        מה קורה כשאתם עובדים איתנו
      </p>
      <h2
        className="mt-2 font-extrabold text-ran-text-on-light md:mt-3"
        style={{
          fontSize: compact ? "clamp(1.15rem, 0.95rem + 2.4vw, 1.5rem)" : "clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)",
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
        }}
      >
        בונים אוטומציות שמגדילות את העסק שלכם, בזמן שאתם מתמקדים במה שחשוב
      </h2>
    </div>
  )
}

// Compact swipeable version of the same 4 benefits, for the mobile sticky
// panel — one card at a time keeps it short enough to fit alongside the
// counter instead of needing the full stacked list.
function BenefitsCarousel() {
  const autoplay = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }))
  // direction: "rtl" is not optional here — the page itself is RTL, and
  // without telling Embla that, its internal scroll-position math assumes
  // LTR while the actual flex row renders RTL. Confirmed by inspecting a
  // broken instance directly: every slide's transform landed hundreds of
  // pixels outside the visible window, consistently, not just jittery —
  // exactly the signature of this exact mismatch (matches how the
  // sibling use-cases carousel is configured, which doesn't have this bug).
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", direction: "rtl" },
    [autoplay.current]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

  }, [emblaApi, onSelect])

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="min-w-0 shrink-0 grow-0 basis-full px-2">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="font-bold text-ran-text-on-light">{benefit.title}</p>
                  <p className="text-sm leading-relaxed text-ran-text-on-light-muted">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {BENEFITS.map((benefit, index) => (
          <button
            key={benefit.title}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`עבור להיתרון ${index + 1}`}
            aria-current={index === selectedIndex}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === selectedIndex ? "w-5 bg-ran-text-on-light" : "w-1.5 bg-ran-glass-border-light"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function BenefitsDetails() {
  return (
    <div>
      <p className="leading-relaxed text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body-lg)" }}>
        עוזרים לעסקים לחסוך זמן, להגדיל הכנסות ולהרחיב את הפעילות עם מערכות AI חכמות שנבנות בדיוק לפי הצורך שלכם.
      </p>
      <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon
          return (
            <RevealItem key={benefit.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-ran-text-on-light">{benefit.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ran-text-on-light-muted">{benefit.description}</p>
              </div>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </div>
  )
}

// ── Growth chart ────────────────────────────────────────────────────────
// Replaces the old vertical ticking-month list + triple-concentric-circle
// badge with one thing: a line chart that draws itself in as you scroll,
// with a live marker riding its leading edge. Same idea as before (scroll
// progress = money saved), different, more literal visual — the shape of
// the line does the "growth" storytelling instead of a separate icon badge.
//
// The curve is one hand-authored cubic bezier, not real per-month data (the
// old ticking list wasn't either — it was decorative). Because it's a single
// bezier, the marker's position can be computed with the textbook cubic
// point formula instead of a DOM `getPointAtLength()` read every frame —
// keeps the whole thing on pure Motion values with no React re-renders per
// scroll tick, matching how the rest of this file already treats scroll perf
// as something to protect deliberately, not incidentally.
const CHART_W = 400
const CHART_H = 150
const CURVE_P0 = { x: 6, y: 130 }
const CURVE_P1 = { x: 150, y: 116 }
const CURVE_P2 = { x: 270, y: 34 }
const CURVE_P3 = { x: 394, y: 12 }
const CURVE_D = `M${CURVE_P0.x},${CURVE_P0.y} C${CURVE_P1.x},${CURVE_P1.y} ${CURVE_P2.x},${CURVE_P2.y} ${CURVE_P3.x},${CURVE_P3.y}`
const CURVE_AREA_D = `${CURVE_D} L${CURVE_P3.x},${CHART_H} L${CURVE_P0.x},${CHART_H} Z`
const CHART_ACCENT = "#16a34a" // growth = green, the same read as a positive number anywhere else

function cubicPoint(t: number) {
  const u = 1 - t
  const b0 = u * u * u
  const b1 = 3 * u * u * t
  const b2 = 3 * u * t * t
  const b3 = t * t * t
  return {
    x: b0 * CURVE_P0.x + b1 * CURVE_P1.x + b2 * CURVE_P2.x + b3 * CURVE_P3.x,
    y: b0 * CURVE_P0.y + b1 * CURVE_P1.y + b2 * CURVE_P2.y + b3 * CURVE_P3.y,
  }
}

function GrowthChart({
  progress,
  activeIndex,
  amount,
  months,
}: {
  progress: MotionValue<number>
  activeIndex: MotionValue<number>
  amount: MotionValue<string>
  months: string[]
}) {
  const clipId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  // This section stays mounted for the rest of the session once scrolled
  // past, so an unconditional `repeat: Infinity` ping below would keep
  // animating forever in the background — freeze it off-screen instead,
  // same discipline this file already applied to the old badge.
  const inView = useInView(wrapRef, { margin: "200px" })

  const clamped = useTransform(progress, clamp01)
  const dotX = useTransform(clamped, (t) => cubicPoint(t).x)
  const dotY = useTransform(clamped, (t) => cubicPoint(t).y)
  const fillWidth = useTransform(clamped, (t) => t * CHART_W)
  const currentMonth = useTransform(activeIndex, (i) => {
    const idx = Math.round(Math.min(months.length - 1, Math.max(0, i)))
    return months[idx] ?? months[0]
  })

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-md rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_24px_60px_-24px_rgba(17,17,17,0.18)] md:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">
          החיסכון שלך
        </p>
        <motion.p className="text-xs font-medium tabular-nums text-ran-text-on-light-muted">
          {currentMonth}
        </motion.p>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-ran-text-on-light-muted">₪</span>
        <motion.p
          className="whitespace-nowrap font-extrabold tabular-nums text-ran-text-on-light"
          style={{ fontSize: "clamp(2rem, 1.3rem + 3.2vw, 3.25rem)" }}
        >
          {amount}
        </motion.p>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="mt-5 h-auto w-full overflow-visible">
        <defs>
          <clipPath id={clipId}>
            <motion.rect x={0} y={0} height={CHART_H} style={{ width: fillWidth }} />
          </clipPath>
        </defs>

        {/* filled area, revealed left-to-right by the same clip that reveals the line */}
        <path d={CURVE_AREA_D} fill={CHART_ACCENT} opacity={0.06} clipPath={`url(#${clipId})`} />

        {/* full-length neutral rail, so the un-drawn portion of the curve is still legible as "where this is going" */}
        <path d={CURVE_D} fill="none" stroke="var(--border-subtle)" strokeWidth={2} strokeLinecap="round" />

        {/* the drawn-in portion, tracking scroll progress exactly like process-section's rail fill */}
        <motion.path
          d={CURVE_D}
          fill="none"
          stroke={CHART_ACCENT}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ pathLength: clamped }}
        />

        {/* live marker riding the leading edge */}
        <motion.circle
          cx={dotX}
          cy={dotY}
          r={9}
          fill={CHART_ACCENT}
          initial={{ opacity: 0.3 }}
          animate={inView ? { r: [9, 17], opacity: [0.3, 0] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.circle
          cx={dotX}
          cy={dotY}
          r={4.5}
          fill={CHART_ACCENT}
          stroke="var(--surface-raised)"
          strokeWidth={2}
        />
      </svg>
    </div>
  )
}
