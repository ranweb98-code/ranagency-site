"use client"

import { Check } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"

/* The one number to change when a seat goes. It is a claim about real
   availability, not decoration — a counter that never moves, or one that
   moves on its own, is worse than no counter at all. */
const SPOTS_TAKEN = 6
const SPOTS_TOTAL = 10

const INCLUDES = [
  "מענה לשיחות נכנסות תוך שניות, 24/7",
  "מערכת CRM מלאה כלולה",
  "עברית טבעית, לא תשובות רובוטיות",
  "איסוף פרטי לידים וקביעת תורים ביומן",
  "העברה אליכם כששאלה חורגת",
]

export function FoundingOfferSection() {
  const spotsLeft = SPOTS_TOTAL - SPOTS_TAKEN
  const filledPercent = (SPOTS_TAKEN / SPOTS_TOTAL) * 100

  return (
    <section id="founding" className="bg-ran-surface-light py-20 md:py-24">
      <SectionContainer>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">
            מחיר מייסדים
          </p>
          <h2
            className="mt-4 font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.025em" }}
          >
            נותרו {spotsLeft} מקומות מתוך {SPOTS_TOTAL}
          </h2>
          <p
            className="mt-4 text-ran-text-on-light-muted"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6 }}
          >
            העסקים הראשונים שעולים לאוויר נכנסים במחיר מייסדים, נעול ל-12 חודשים.
          </p>
        </Reveal>

        {/* ── the meter ───────────────────────────────────────────── */}
        <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-bold text-ran-text-on-light">
              {SPOTS_TAKEN} מתוך {SPOTS_TOTAL} מקומות נתפסו
            </span>
            <span className="text-sm font-semibold text-ran-text-on-light-muted">
              נותרו {spotsLeft}
            </span>
          </div>

          <div
            className="founding-track"
            role="img"
            aria-label={`${SPOTS_TAKEN} מתוך ${SPOTS_TOTAL} מקומות נתפסו`}
          >
            <div className="founding-fill" style={{ width: `${filledPercent}%` }} />
          </div>
        </Reveal>

        {/* TODO(pricing): the old per-channel prices (WhatsApp / Instagram /
            three-channel bundle with 500 voice minutes) no longer describe
            the offer. Ran has not set voice-only prices yet, so none are shown
            here; replace this card when he does. */}
        <Reveal delay={0.1} className="mx-auto mt-14 max-w-md">
          <div className="flex flex-col rounded-3xl border border-ran-text-on-light bg-ran-surface-dark p-6 text-right text-ran-text-on-dark">
            <h3 className="text-lg font-bold text-ran-text-on-dark">סוכן קולי</h3>
            <p className="mt-1 text-sm text-ran-text-on-dark-muted">מחיר מייסדים לפי נפח השיחות והעסק</p>
            <p className="mt-6 border-t border-ran-glass-border-dark pt-5 text-sm text-ran-text-on-dark-muted">
              המחיר המדויק נקבע בייעוץ החינם.
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-ran-glass-border-dark pt-5">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-ran-text-on-dark" aria-hidden="true" />
                  <span className="text-sm text-ran-text-on-dark-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-col items-center gap-4">
          <MagneticButton>
            <Button
              size="lg"
              className="cta-glow rounded-full bg-ran-text-on-light px-9 text-white"
              render={<a href="#contact" />}
              nativeButton={false}
            >
              לתפוס מקום
            </Button>
          </MagneticButton>

          <p className="text-center text-xs text-ran-text-on-light-muted">
            מחיר המייסדים מותנה בהתחייבות ל-12 חודשים · בתשלום שנתי מראש חודש נוסף חינם
          </p>
        </Reveal>
      </SectionContainer>
    </section>
  )
}
