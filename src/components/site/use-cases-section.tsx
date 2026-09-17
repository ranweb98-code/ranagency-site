"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, ChevronRight, TrendingUp, Wand2, type LucideIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface UseCase {
  audience: string
  challenge: string
  solution: string
  result: string
}

const USE_CASES: UseCase[] = [
  {
    audience: "מסעדות ומעדניות",
    challenge: "מקבלים עשרות הודעות ביום על שעות פתיחה, תפריט, הזמנות ומיקום",
    solution: "סוכן וואטסאפ שיענה אוטומטית על כל השאלות, יאסוף הזמנות וישלח תפריט מעודכן",
    result:
      "חיסכון של 2-3 שעות ביום, אף לקוח לא יחכה בתור, והזמנות ימשיכו להגיע גם בשעות העומס",
  },
  {
    audience: "מכוני יופי וקוסמטיקה",
    challenge: "לקוחות מתקשרים ושולחים הודעות כל היום לקביעת תורים",
    solution: "סוכן וואטסאפ שיאפשר קביעת תורים אוטומטית 24/7 עם Google Calendar",
    result:
      "הלקוחות קובעים תורים לבד, אתה מקבל התראה מיידית, ואין יותר פספוסים או תורים כפולים",
  },
  {
    audience: "עסקי שירותים ויועצים",
    challenge: "מבזבז זמן על מענה לפניות ראשוניות ותיאום פגישות",
    solution: "סוכן שיאסוף פרטים, יענה על שאלות נפוצות ויקבע פגישות ייעוץ אוטומטית",
    result: "רק לידים איכותיים מגיעים אליך, כבר עם כל הפרטים הרלוונטיים",
  },
  {
    audience: "חנויות אונליין",
    challenge: "לקוחות שואלים על מוצרים, מחירים, זמני אספקה ומלאי",
    solution: "סוכן שישלח קטלוג מוצרים, יענה על שאלות ויעדכן במבצעים",
    result: "המרה גבוהה יותר, פחות נטישת עגלה, ויותר מכירות",
  },
  {
    audience: "ניהול אספקה אוטומטי",
    challenge: "בעל עסק צריך לשלוח הודעות לספק וללקוחות כל יום",
    solution: "סוכן ששולח הודעות לכל הלקוחות, אוסף תשובות, שולח סיכום לבעל העסק ורשימה לספק",
    result: "חיסכון של 56 דקות ביום = 28 שעות בחודש",
  },
  {
    audience: 'סוכנויות נדל"ן',
    challenge: "מתקשרים ושואלים על נכסים, מחירים וזמינות לצפייה בכל שעה",
    solution: "סוכן ששולח פרטי נכסים, תמונות ומחירים, ומתאם צפיות בלוח הזמנים שלך אוטומטית",
    result: "יותר צפיות בפועל, פחות זמן על מענה טלפוני, ולידים ממוינים לפי רצינות",
  },
]

const STEPS: { key: "challenge" | "solution" | "result"; label: string; icon: LucideIcon }[] = [
  { key: "challenge", label: "האתגר", icon: AlertTriangle },
  { key: "solution", label: "הפתרון", icon: Wand2 },
  { key: "result", label: "התוצאה", icon: TrendingUp },
]

const AUTOPLAY_INTERVAL_MS = 4500

// Replaces the old embla autoplay carousel (dimmed neighbour cards sliding
// past) with a tab switcher: pick an industry, its 3-step story swaps in.
// Cycles on its own so the section has life without being asked — but pauses
// the moment a visitor is actually reading it (hover) so autoplay never
// yanks a card out from under someone mid-read, and sits still entirely for
// prefers-reduced-motion.
export function UseCasesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const active = USE_CASES[activeIndex]

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % USE_CASES.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(id)
    // Re-armed on every activeIndex change — including a manual tab click —
    // so picking a tab by hand always buys a full fresh interval instead of
    // autoplay silently overriding the choice moments later.
  }, [activeIndex, isPaused, prefersReducedMotion])

  return (
    <section id="use-cases" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">
            דוגמאות שימוש
          </p>
          <h2
            className="font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            איך זה עוזר בפועל
          </h2>
        </Reveal>

        <Reveal>
          {/* industry picker — a sliding pill (layoutId) tracks the active tab,
              horizontally scrollable on mobile since 6 labels don't fit a
              narrow viewport without wrapping into a second, misaligned row */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
            {USE_CASES.map((useCase, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={useCase.audience}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-current={isActive}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive ? "text-white" : "text-ran-text-on-light-muted hover:text-ran-text-on-light"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="use-case-pill"
                      className="absolute inset-0 rounded-full bg-ran-text-on-light"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{useCase.audience}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative mt-8 overflow-hidden rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_24px_60px_-24px_rgba(17,17,17,0.16)] md:p-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.audience}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* left-to-right like the flow diagrams elsewhere on the page —
                  same convention, same reasoning: a challenge → solution →
                  result chain reads as a process, and processes read
                  left-to-right by near-universal convention even on an RTL
                  page (the reference this whole flow-diagram language is
                  built on made the identical call). */}
              <div dir="ltr" className="grid gap-4 md:grid-cols-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isResult = step.key === "result"
                  return (
                    <div key={step.key} className="relative">
                      <div
                        dir="rtl"
                        className={cn(
                          "flex h-full flex-col gap-3 rounded-2xl border p-5",
                          isResult
                            ? "border-ran-text-on-light bg-ran-text-on-light text-white"
                            : "border-ran-glass-border-light bg-ran-surface-subtle text-ran-text-on-light"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full border",
                            isResult ? "border-white/25 text-white" : "border-ran-glass-border-light text-ran-text-on-light"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.1em]",
                            isResult ? "text-white/70" : "text-ran-text-on-light-muted"
                          )}
                        >
                          {step.label}
                        </p>
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            isResult ? "text-white/90" : "text-ran-text-on-light-muted"
                          )}
                        >
                          {active[step.key]}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute top-1/2 -right-3 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light-muted md:flex"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <p dir="rtl" className="mt-6 text-sm font-semibold text-ran-text-on-light">
                {active.audience}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </SectionContainer>
    </section>
  )
}
