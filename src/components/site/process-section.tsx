"use client"

import { motion, useScroll, useTransform } from "motion/react"
import { ClipboardList, Hammer, LifeBuoy, PhoneCall, Rocket, type LucideIcon } from "lucide-react"
import { useRef } from "react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: PhoneCall,
    title: "שיחת ייעוץ ללא התחייבות",
    description:
      "נכיר, נבין את הצרכים שלך, נזהה הזדמנויות לאוטומציה ונבנה תוכנית פעולה מותאמת",
  },
  {
    icon: ClipboardList,
    title: "בונים תוכנית עבודה מפורטת",
    description:
      "נגדיר יחד את כל השאלות הנפוצות, התהליכים העסקיים והאוטומציות הנדרשות",
  },
  {
    icon: Hammer,
    title: "מקימים את המערכת",
    description:
      "בונים את הבוט או האתר, מחברים מערכות, מוסיפים תוכן ובודקים שהכל עובד מושלם",
  },
  {
    icon: Rocket,
    title: "עולים לאוויר",
    description: "משיקים את המערכת, מדריכים אותך איך להשתמש, ועומדים לרשותך לכל שאלה",
  },
  {
    icon: LifeBuoy,
    title: "ממשיכים לצמוח יחד",
    description: "עוקבים אחרי הביצועים, מנתחים נתונים, משפרים ומשדרגים לפי הצורך",
  },
]

export function ProcessSection() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.75", "end 0.4"],
  })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  const mobileTrackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: mobileScrollYProgress } = useScroll({
    target: mobileTrackRef,
    offset: ["start 0.85", "end 0.6"],
  })
  const mobileLineScale = useTransform(mobileScrollYProgress, [0, 1], [0, 1])

  return (
    <section id="process" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-16 space-y-3 text-center">
          <p className="text-sm font-semibold tracking-wide text-ran-primary">תהליך העבודה</p>
          <h2
            className="font-bold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            מהשיחה הראשונה ועד ההשקה
          </h2>
        </Reveal>

        {/* Desktop / tablet — horizontal timeline, bar fills left as you scroll */}
        <div ref={trackRef} className="relative hidden sm:block">
          <div className="absolute inset-x-[10%] top-7 h-[2px] bg-ran-glass-border-light" />
          <motion.div
            className="absolute inset-x-[10%] top-7 h-[2px] origin-right bg-gradient-to-l from-ran-primary to-ran-accent"
            style={{ scaleX: lineScale }}
          />

          <RevealGroup className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <RevealItem key={step.title} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ran-surface-light-raised shadow-[0_2px_16px_-6px_rgba(20,20,26,0.2)]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-ran-primary">שלב {index + 1}</p>
                  <h3
                    className="mt-1 font-bold text-ran-text-on-light"
                    style={{ fontSize: "var(--text-h3)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="mt-2 leading-relaxed text-ran-text-on-light-muted"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {step.description}
                  </p>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>

        {/* Mobile — vertical timeline, bar fills down the side as you scroll */}
        <div ref={mobileTrackRef} className="relative sm:hidden">
          <div className="absolute inset-y-6 right-6 w-[2px] bg-ran-glass-border-light" />
          <motion.div
            className="absolute inset-y-6 right-6 w-[2px] origin-top bg-gradient-to-b from-ran-primary to-ran-accent"
            style={{ scaleY: mobileLineScale }}
          />

          <RevealGroup className="relative space-y-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <RevealItem key={step.title} className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ran-surface-light-raised shadow-[0_2px_16px_-6px_rgba(20,20,26,0.2)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-ran-primary">שלב {index + 1}</p>
                    <h3
                      className="mt-1 font-bold text-ran-text-on-light"
                      style={{ fontSize: "var(--text-h3)" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="mt-2 leading-relaxed text-ran-text-on-light-muted"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </SectionContainer>
    </section>
  )
}
