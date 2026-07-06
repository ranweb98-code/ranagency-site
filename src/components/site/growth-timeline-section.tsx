"use client"

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { ChevronsUp, Clock, Rocket, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react"
import { useMemo, useRef } from "react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"

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
  const eased = Math.pow(clamp01(p), 1.9)
  const value = START_VALUE + (END_VALUE - START_VALUE) * eased
  return Math.round(value).toLocaleString("en-US")
}

export function GrowthTimelineSection() {
  const pinRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.4 })

  const months = useMonthLabels(MONTH_COUNT)
  const activeIndex = useTransform(progress, (p) => clamp01(p) * (MONTH_COUNT - 1))
  const amount = useTransform(progress, formatAmount)

  return (
    // NOTE: no `overflow-hidden` here — it breaks `position: sticky` on the
    // pinned panel below (an ancestor with overflow other than visible
    // constrains the sticky containing block). Inner elements clip themselves.
    <section className="relative bg-white">
      <div ref={pinRef} className="relative h-[200vh] md:h-[280vh]">
        <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden pt-16 md:pt-20">
          <SectionContainer className="w-full">
            <div dir="ltr" className="grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
              {/* animated timeline visual — identical composition at every size, just scaled */}
              <div className="flex justify-center md:justify-start">
                <div className="flex flex-col items-center gap-6 md:hidden">
                  <div dir="rtl" className="max-w-[280px] text-center">
                    <Reveal>
                      <BenefitsIntro compact />
                    </Reveal>
                  </div>
                  <TimelineWidget variant="compact" months={months} progress={progress} activeIndex={activeIndex} amount={amount} />
                </div>
                <div className="hidden md:block">
                  <TimelineWidget variant="full" months={months} progress={progress} activeIndex={activeIndex} amount={amount} />
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

      {/* value proposition — mobile, revealed normally once the pin releases */}
      <SectionContainer className="pb-24 pt-2 md:hidden">
        <Reveal>
          <BenefitsDetails />
        </Reveal>
      </SectionContainer>
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
  return (
    <motion.div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent font-bold text-white shadow-[0_0_18px_-3px_var(--color-ran-primary)]"
      style={{ width: size, height: size, fontSize: size * 0.5, scale: coreScale }}
      animate={{ rotate: [0, -6, 0, 6, 0] }}
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
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: outer, height: outer }}>
      <motion.div
        className="absolute rounded-full bg-ran-primary/25 blur-3xl"
        style={{ width: outer, height: outer, scale: glowScale }}
        animate={{ opacity: [0.5, 0.85, 0.5] }}
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
