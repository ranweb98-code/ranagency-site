import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"

/* The one number to change when a seat goes. It is a claim about real
   availability, not decoration — a counter that never moves, or moves on its
   own, is worse than no counter at all. */
const SPOTS_TAKEN = 6
const SPOTS_TOTAL = 10

export function FoundingOfferSection() {
  const spotsLeft = SPOTS_TOTAL - SPOTS_TAKEN

  return (
    <section
      id="founding"
      className="relative overflow-hidden bg-ran-surface-dark py-24 text-ran-text-on-dark"
    >
      <SectionContainer className="flex flex-col items-center text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-dark-muted">
            מחיר מייסדים
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="mt-5 font-extrabold text-ran-text-on-dark"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.025em" }}
          >
            נותרו {spotsLeft} מקומות
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p
            className="mt-4 max-w-2xl text-ran-text-on-dark-muted"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6 }}
          >
            עשרת העסקים הראשונים שעולים לאוויר נכנסים במחיר מייסדים, נעול לשנה שלמה.
            בתמורה נבקש מכם משוב כן ורשות לספר את הסיפור שלכם.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 w-full max-w-2xl">
          <div
            className="founding-meter"
            role="img"
            aria-label={`${SPOTS_TAKEN} מתוך ${SPOTS_TOTAL} מקומות נתפסו`}
          >
            {Array.from({ length: SPOTS_TOTAL }, (_, index) => {
              const taken = index < SPOTS_TAKEN
              const isEdge = index === SPOTS_TAKEN - 1

              return (
                <span
                  key={index}
                  className={[
                    "founding-spot",
                    taken ? "founding-spot-taken" : "",
                    isEdge ? "founding-spot-edge" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              )
            })}
          </div>

          <p className="mt-4 text-sm font-semibold text-ran-text-on-dark-muted">
            {SPOTS_TAKEN} מתוך {SPOTS_TOTAL} מקומות נתפסו
          </p>
        </Reveal>

        <Reveal delay={0.2} className="mt-12 w-full max-w-xl">
          <div className="rounded-3xl border border-ran-glass-border-dark bg-ran-surface-dark-raised p-8 text-right md:p-10">
            <p className="text-sm font-semibold text-ran-text-on-dark-muted">
              סוכן וואטסאפ + סוכן אינסטגרם + דשבורד CRM
            </p>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold leading-none text-ran-text-on-dark">
                    ₪890
                  </span>
                  <span className="text-sm text-ran-text-on-dark-muted">לחודש</span>
                </div>
                <p className="mt-2 text-sm text-ran-text-on-dark-muted">
                  במקום <s>₪1,190</s>
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold leading-none text-ran-text-on-dark">
                    ₪5,900
                  </span>
                  <span className="text-sm text-ran-text-on-dark-muted">הקמה</span>
                </div>
                <p className="mt-2 text-sm text-ran-text-on-dark-muted">
                  במקום <s>₪8,900</s>
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-ran-glass-border-dark pt-7">
              <MagneticButton>
                <Button
                  size="lg"
                  className="w-full rounded-full bg-ran-text-on-dark px-9 text-ran-surface-dark hover:bg-white"
                  render={<a href="#contact" />}
                  nativeButton={false}
                >
                  לתפוס מקום
                </Button>
              </MagneticButton>

              <p className="mt-4 text-center text-xs text-ran-text-on-dark-muted">
                המחיר נעול ל-12 חודשים · המחירים אינם כוללים מע״מ
              </p>
            </div>
          </div>
        </Reveal>
      </SectionContainer>
    </section>
  )
}
