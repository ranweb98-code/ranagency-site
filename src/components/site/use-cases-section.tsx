"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, Wand2 } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
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
    solution: "בוט שיענה אוטומטית על כל השאלות, יאסוף הזמנות וישלח תפריט מעודכן",
    result:
      "חיסכון של 2-3 שעות ביום, אף לקוח לא יחכה בתור, והזמנות ימשיכו להגיע גם בשעות העומס",
  },
  {
    audience: "מכוני יופי וקוסמטיקה",
    challenge: "לקוחות מתקשרים ושולחים הודעות כל היום לקביעת תורים",
    solution: "בוט וואטסאפ שיאפשר קביעת תורים אוטומטית 24/7 עם Google Calendar",
    result:
      "הלקוחות קובעים תורים לבד, אתה מקבל התראה מיידית, ואין יותר פספוסים או תורים כפולים",
  },
  {
    audience: "עסקי שירותים ויועצים",
    challenge: "מבזבז זמן על מענה לפניות ראשוניות ותיאום פגישות",
    solution: "בוט שיאסוף פרטים, יענה על שאלות נפוצות ויקבע פגישות ייעוץ אוטומטית",
    result: "רק לידים איכותיים מגיעים אליך, כבר עם כל הפרטים הרלוונטיים",
  },
  {
    audience: "חנויות אונליין",
    challenge: "לקוחות שואלים על מוצרים, מחירים, זמני אספקה ומלאי",
    solution: "בוט שישלח קטלוג מוצרים, יענה על שאלות ויעדכן במבצעים",
    result: "המרה גבוהה יותר, פחות נטישת עגלה, ויותר מכירות",
  },
  {
    audience: "ניהול אספקה אוטומטי",
    challenge: "בעל עסק צריך לשלוח הודעות לספק וללקוחות כל יום",
    solution: "בוט ששולח הודעות לכל הלקוחות, אוסף תשובות, שולח סיכום לבעל העסק ורשימה לספק",
    result: "חיסכון של 56 דקות ביום = 28 שעות בחודש",
  },
  {
    audience: "סוכנויות נדל\"ן",
    challenge: "מתקשרים ושואלים על נכסים, מחירים וזמינות לצפייה בכל שעה",
    solution: "בוט ששולח פרטי נכסים, תמונות ומחירים, ומתאם צפיות בלוח הזמנים שלך אוטומטית",
    result: "יותר צפיות בפועל, פחות זמן על מענה טלפוני, ולידים ממוינים לפי רצינות",
  },
]

const ROWS = [
  { key: "challenge" as const, label: "האתגר", icon: AlertTriangle, color: "text-ran-text-on-light-muted" },
  { key: "solution" as const, label: "הפתרון", icon: Wand2, color: "text-ran-primary" },
  { key: "result" as const, label: "התוצאה", icon: TrendingUp, color: "text-ran-accent" },
]

// Centered, highlighted-active-card carousel, adapted from the Embla
// "centered highlighted testimonial cards" example — the active (centered)
// slide scales up to full opacity/saturation while its neighbors sit
// scaled-down and dimmed. Autoplay advances every 5s but keeps running after
// manual clicks (stopOnInteraction: false) rather than freezing on the last
// card the visitor picked.
export function UseCasesSection() {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }))
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", direction: "rtl", containScroll: "trimSnaps" },
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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  return (
    <section id="use-cases" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-sm font-semibold tracking-wide text-ran-primary">דוגמאות שימוש</p>
          <h2
            className="font-bold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            איך זה עוזר בפועל
          </h2>
        </Reveal>

        {/* py so the active card's glow/shadow isn't clipped by the viewport's
            overflow-hidden edge — a 40px-blur shadow needs real room to fade
            all the way to transparent, or the clip edge shows as a hard line
            (24px wasn't enough; the shadow was still visibly dark there). */}
        <div className="-my-16 overflow-hidden py-16" ref={emblaRef}>
          <div className="-mx-3 flex">
            {USE_CASES.map((useCase, index) => {
              const isActive = index === selectedIndex
              return (
                <div key={useCase.audience} className="min-w-0 shrink-0 grow-0 basis-[88%] px-3 sm:basis-[65%] lg:basis-[42%]">
                  <button
                    type="button"
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "h-full w-full rounded-3xl border p-6 text-right shadow-[0_2px_20px_-8px_rgba(20,20,26,0.1)] transition-all duration-300 ease-out",
                      isActive
                        ? "scale-100 border-ran-primary/30 bg-ran-surface-light-raised opacity-100 shadow-[0_12px_40px_-10px_rgba(61,107,251,0.3)]"
                        : "scale-[0.92] border-ran-glass-border-light bg-ran-surface-light-raised opacity-40 saturate-[0.85]"
                    )}
                  >
                    <h3 className="font-bold text-ran-text-on-light" style={{ fontSize: "var(--text-h3)" }}>
                      {useCase.audience}
                    </h3>
                    <dl className="mt-4 space-y-3">
                      {ROWS.map((row) => {
                        const Icon = row.icon
                        return (
                          <div key={row.key} className="flex gap-3 border-r-2 border-ran-glass-border-light pr-3">
                            <dt
                              className={`flex shrink-0 items-center gap-1.5 font-semibold ${row.color}`}
                              style={{ fontSize: "var(--text-caption)" }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {row.label}
                            </dt>
                            <dd className="text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body)" }}>
                              {useCase[row.key]}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={scrollNext}
            aria-label="הדוגמה הבאה"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ran-glass-border-light bg-white text-ran-text-on-light transition-colors hover:border-ran-primary/40 hover:text-ran-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {USE_CASES.map((useCase, index) => (
              <button
                key={useCase.audience}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`עבור לדוגמה ${index + 1}`}
                aria-current={index === selectedIndex}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === selectedIndex ? "w-6 bg-ran-primary" : "w-2 bg-ran-glass-border-light"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="הדוגמה הקודמת"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ran-glass-border-light bg-white text-ran-text-on-light transition-colors hover:border-ran-primary/40 hover:text-ran-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </SectionContainer>
    </section>
  )
}
