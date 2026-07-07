"use client"

import { motion, useInView, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { ChevronsUp, Clock, Rocket, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { cn } from "@/lib/utils"

const START_VALUE = 1200
const END_VALUE = 98000
const MONTH_COUNT = 13

const SIZE = {
  compact: {
    track: 290,
    row: 48,
    colWidth: 140,
    colPadding: "pr-7",
    dateFont: "text-[11px]",
    outer: 150,
    mid: 92,
    core: 44,
    gap: "gap-2",
    tickWidth: "w-1",
    svgWidth: "w-6",
    moneyBadge: 30,
    moneyLabelFont: "text-[11px]",
    numberFont: "clamp(1.3rem, 0.9rem + 3vw, 2.2rem)",
  },
  full: {
    track: 300,
    row: 50,
    colWidth: 148,
    colPadding: "pr-9",
    dateFont: "text-sm",
    outer: 180,
    mid: 112,
    core: 54,
    gap: "gap-3 lg:gap-4",
    tickWidth: "w-3",
    svgWidth: "w-10",
    moneyBadge: 34,
    moneyLabelFont: "text-xs",
    numberFont: "clamp(1.75rem, 1.1rem + 2vw, 3rem)",
  },
} as const

type SizeVariant = keyof typeof SIZE

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
  // Any spring smoothing here lags the raw scroll position by definition —
  // fine for decorative motion, but the sticky pin's release is driven by
  // the real (unsprung) scroll position, so a smoothed value can still be
  // short of "done" when the pin lets go, no matter how tightly the spring
  // is tuned (confirmed: even a ~150ms-settle spring visibly undershot on a
  // fast flick). So the number/month that must land exactly on completion
  // read straight off raw scrollYProgress; only the decorative glow/core
  // pulse (where a frame or two of lag is invisible) gets the spring.
  const glowProgress = useSpring(scrollYProgress, { stiffness: 800, damping: 50, mass: 1 })

  const months = useMonthLabels(MONTH_COUNT)
  const activeIndex = useTransform(scrollYProgress, (p) => clamp01(p) * (MONTH_COUNT - 1))
  const amount = useTransform(scrollYProgress, formatAmount)

  return (
    // NOTE: no `overflow-hidden` here — it breaks `position: sticky` on the
    // pinned panel below (an ancestor with overflow other than visible
    // constrains the sticky containing block). Inner elements clip themselves.
    <section className="relative bg-white">
      {/* Back to the original, slower pace — the shortened 130/160vh pin
          made the whole animation feel rushed. */}
      <div ref={pinRef} className="relative h-[200vh] md:h-[280vh]">
        {/* Shorter sticky panel on mobile — the compact column is much
            shorter than a full viewport, and centering it in a full 100dvh
            panel left a huge dead-space gap below it before the next
            section's text appeared. No `overflow-hidden` here (same reason
            as the pinRef note below): the Indicator's blur-3xl glow is
            large enough to reach this panel's edge once it's this short,
            and clipping it showed as a hard line instead of a soft fade —
            same white background on both sides, so letting it bleed
            slightly past the box is invisible. */}
        {/* Taller again on mobile now that the benefits carousel lives in
            here too — see below for why it moved. */}
        <div className="sticky top-0 flex h-[92dvh] items-center pt-6 md:h-[100dvh] md:pt-20">
          <SectionContainer className="w-full">
            <div dir="ltr" className="grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
              {/* animated timeline visual — identical composition at every size, just scaled */}
              <div className="flex justify-center md:justify-start">
                {/* Mobile: the benefits carousel now lives inside the sticky
                    panel, right under the counter, instead of appearing as
                    separate content once the pin released. It used to sit
                    below the pin in normal flow, revealed only at release —
                    which meant it was invisible the whole time you were
                    watching the counter, then suddenly appeared/shifted
                    into place the moment the pin let go. Living here means
                    it's simply always there, never moving on its own. */}
                <div dir="rtl" className="flex w-full max-w-xs flex-col items-center gap-4 md:hidden">
                  <Reveal className="w-full">
                    <div className="text-center">
                      <BenefitsIntro compact />
                    </div>
                    <div className="mt-5">
                      <TimelineWidget
                        variant="compact"
                        months={months}
                        progress={glowProgress}
                        activeIndex={activeIndex}
                        amount={amount}
                      />
                    </div>
                    <div className="mt-5">
                      <BenefitsCarousel />
                    </div>
                  </Reveal>
                </div>
                <div className="hidden md:block">
                  <TimelineWidget variant="full" months={months} progress={glowProgress} activeIndex={activeIndex} amount={amount} />
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
      <p className={`font-semibold tracking-wide text-ran-primary ${compact ? "text-xs" : "text-sm"}`}>
        מה קורה כשאתם עובדים איתנו
      </p>
      <h2
        className="mt-2 font-bold text-ran-text-on-light md:mt-3"
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white">
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
              index === selectedIndex ? "w-5 bg-ran-primary" : "w-1.5 bg-ran-glass-border-light"
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white">
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

function TimelineWidget({
  variant,
  months,
  progress,
  activeIndex,
  amount,
}: {
  variant: SizeVariant
  months: string[]
  progress: MotionValue<number>
  activeIndex: MotionValue<number>
  amount: MotionValue<string>
}) {
  const s = SIZE[variant]
  const trackY = useTransform(activeIndex, (i) => s.track / 2 - s.row / 2 - i * s.row)
  const glowScale = useTransform(progress, [0, 1], [0.9, 1.3])
  const coreScale = useTransform(progress, [0, 1], [0.94, 1.12])

  return (
    <div className={`flex items-center ${s.gap}`}>
      <TimelineColumn
        months={months}
        trackY={trackY}
        activeIndex={activeIndex}
        track={s.track}
        row={s.row}
        colWidth={s.colWidth}
        colPaddingClass={s.colPadding}
        dateFontClass={s.dateFont}
        svgWidthClass={s.svgWidth}
        tickWidthClass={s.tickWidth}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1.5">
          <span className={`whitespace-nowrap font-semibold tracking-wide text-ran-primary/80 ${s.moneyLabelFont}`}>
            הכסף שלך
          </span>
          <div className="flex items-center gap-1.5">
            <MoneyBadge size={s.moneyBadge} coreScale={coreScale} />
            <motion.p
              className="whitespace-nowrap font-extrabold tabular-nums text-ran-primary"
              style={{ fontSize: s.numberFont, textShadow: "0 0 40px rgba(61,107,251,0.28)" }}
            >
              {amount}
            </motion.p>
          </div>
        </div>
        <Indicator glowScale={glowScale} coreScale={coreScale} outer={s.outer} mid={s.mid} core={s.core} />
      </div>
    </div>
  )
}

function MoneyBadge({ size, coreScale }: { size: number; coreScale: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null)
  // This section stays mounted for the rest of the session once scrolled
  // past, so an unconditional `repeat: Infinity` here keeps animating
  // forever in the background — freeze it off-screen instead.
  const inView = useInView(ref, { margin: "200px" })
  return (
    <motion.div
      ref={ref}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent font-bold text-white shadow-[0_0_18px_-3px_var(--color-ran-primary)]"
      style={{ width: size, height: size, fontSize: size * 0.5, scale: coreScale }}
      animate={inView ? { rotate: [0, -6, 0, 6, 0] } : undefined}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      ₪
    </motion.div>
  )
}

function TimelineColumn({
  months,
  trackY,
  activeIndex,
  track,
  row,
  colWidth,
  colPaddingClass,
  dateFontClass,
  svgWidthClass,
  tickWidthClass,
}: {
  months: string[]
  trackY: MotionValue<number>
  activeIndex: MotionValue<number>
  track: number
  row: number
  colWidth: number
  colPaddingClass: string
  dateFontClass: string
  svgWidthClass: string
  tickWidthClass: string
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: track,
        width: colWidth,
        maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
      }}
    >
      <svg
        className={`pointer-events-none absolute right-0 top-0 h-full ${svgWidthClass} text-ran-primary/40`}
        viewBox="0 0 40 300"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M16 0 L16 108 C16 128 30 136 30 150 C30 164 16 172 16 192 L16 300"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <motion.div className="absolute inset-x-0 top-0" style={{ y: trackY }}>
        {months.map((label, index) => (
          <TimelineRow
            key={label + index}
            label={label}
            index={index}
            activeIndex={activeIndex}
            row={row}
            colPaddingClass={colPaddingClass}
            dateFontClass={dateFontClass}
            tickWidthClass={tickWidthClass}
          />
        ))}
      </motion.div>
    </div>
  )
}

function TimelineRow({
  label,
  index,
  activeIndex,
  row,
  colPaddingClass,
  dateFontClass,
  tickWidthClass,
}: {
  label: string
  index: number
  activeIndex: MotionValue<number>
  row: number
  colPaddingClass: string
  dateFontClass: string
  tickWidthClass: string
}) {
  const distance = useTransform(activeIndex, (i) => Math.abs(i - index))
  const opacity = useTransform(distance, [0, 1, 2.5], [1, 0.5, 0.15])
  const textColor = useTransform(distance, [0, 1.2], ["#3d6bfb", "#5b5f6d"])
  const fontWeight = useTransform(distance, [0, 1], [700, 500])

  return (
    <motion.div className={`flex items-center justify-end gap-2 ${colPaddingClass}`} style={{ height: row, opacity }}>
      <motion.span className={`${dateFontClass} tabular-nums whitespace-nowrap`} style={{ color: textColor, fontWeight }}>
        {label}
      </motion.span>
      <span className={`h-px ${tickWidthClass} bg-ran-glass-border-light`} />
    </motion.div>
  )
}

function Indicator({
  glowScale,
  coreScale,
  outer,
  mid,
  core,
}: {
  glowScale: MotionValue<number>
  coreScale: MotionValue<number>
  outer: number
  mid: number
  core: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "200px" })

  return (
    <div ref={ref} className="relative flex shrink-0 items-center justify-center" style={{ width: outer, height: outer }}>
      <motion.div
        className="absolute rounded-full bg-ran-primary/25 blur-3xl"
        style={{ width: outer, height: outer, scale: glowScale }}
        animate={inView ? { opacity: [0.5, 0.85, 0.5] } : undefined}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="absolute rounded-full bg-ran-primary/10 blur-xl" style={{ width: mid, height: mid }} />
      <motion.div
        className="absolute flex items-center justify-center rounded-full border border-ran-primary/20 bg-white shadow-[0_0_30px_-6px_var(--color-ran-primary)]"
        style={{ width: core, height: core, scale: coreScale }}
      >
        <ChevronsUp className="h-1/2 w-1/2 text-ran-primary" strokeWidth={2.5} />
      </motion.div>
    </div>
  )
}
