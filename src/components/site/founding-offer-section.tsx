"use client"

import { Check } from "lucide-react"
import { useState } from "react"

import { ChannelChoice, type ChannelId } from "@/components/site/channel-choice"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { cn } from "@/lib/utils"

/* The one number to change when a seat goes. It is a claim about real
   availability, not decoration — a counter that never moves, or one that
   moves on its own, is worse than no counter at all. */
const SPOTS_TAKEN = 6
const SPOTS_TOTAL = 10

interface Plan {
  name: string
  channels: string
  monthly: string
  monthlyList: string
  setup: string
  setupList: string
  includes: string[]
  featured?: boolean
  /* The single-channel package runs on either channel, so the card offers the
     choice instead of naming one and leaving the other buyer guessing. */
  choosable?: boolean
}

/* WhatsApp carries costs Instagram does not, so the toggle moves the price
   rather than only the label. Replying inside the 24-hour window is free on
   both — what WhatsApp adds is the provider's monthly platform fee and the
   per-message charge on proactive templates, which is exactly what the
   day-before appointment reminder is. Roughly ₪90 a month of real cost, and
   the gap below is set against it. */
const SINGLE_CHANNEL: Record<ChannelId, Omit<Plan, "name" | "featured" | "choosable">> = {
  whatsapp: {
    channels: "סוכן וואטסאפ",
    monthly: "540",
    monthlyList: "690",
    setup: "2,900",
    setupList: "3,900",
    includes: [
      "מענה תוך שניות, 24/7",
      "עברית טבעית, לא תשובות רובוטיות",
      "איסוף פרטי לידים אוטומטי",
      "תזכורת תור יזומה יום לפני",
      "העברה אליכם כששאלה חורגת",
    ],
  },
  instagram: {
    channels: "סוכן אינסטגרם",
    monthly: "440",
    monthlyList: "590",
    setup: "2,400",
    setupList: "3,400",
    includes: [
      "מענה תוך שניות, 24/7",
      "עברית טבעית, לא תשובות רובוטיות",
      "איסוף פרטי לידים אוטומטי",
      "מענה להודעות פרטיות ולתגובות",
      "העברה אליכם כששאלה חורגת",
    ],
  },
}

const PLANS: Plan[] = [
  {
    name: "ערוץ אחד",
    choosable: true,
    ...SINGLE_CHANNEL.whatsapp,
  },
  {
    name: "שני ערוצים + CRM",
    channels: "וואטסאפ + אינסטגרם",
    monthly: "890",
    monthlyList: "1,190",
    setup: "4,900",
    setupList: "6,900",
    featured: true,
    includes: [
      "כל מה שבחבילת ערוץ אחד",
      "סוכן אינסטגרם להודעות פרטיות",
      "דשבורד CRM אחד לכל הערוצים",
      "סיווג ליד חם/קר וסיכום שיחה",
      "קביעת תורים אוטומטית ביומן",
    ],
  },
  {
    name: "שלושה ערוצים",
    channels: "+ סוכן טלפוני",
    monthly: "1,490",
    monthlyList: "1,990",
    setup: "6,900",
    setupList: "9,900",
    includes: [
      "כל מה שבחבילת שני הערוצים",
      "סוכן קולי שעונה לשיחות נכנסות",
      "500 דקות שיחה בחודש כלולות",
      "מעבר למכסה — ₪0.90 לדקה",
    ],
  },
]

export function FoundingOfferSection() {
  const [channel, setChannel] = useState<ChannelId>("whatsapp")
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

        {/* ── the price list ──────────────────────────────────────── */}
        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {PLANS.map((basePlan) => {
            /* The choosable card takes its prices and its list from whichever
               channel is selected; the other two are fixed. */
            const plan = basePlan.choosable
              ? { ...basePlan, ...SINGLE_CHANNEL[channel] }
              : basePlan

            return (
            <RevealItem key={basePlan.name} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col rounded-3xl border p-6 text-right",
                  plan.featured
                    ? "border-ran-text-on-light bg-ran-surface-dark text-ran-text-on-dark"
                    : "border-ran-glass-border-light bg-ran-surface-light-raised"
                )}
              >
                {/* The channel toggle stands taller than the one-line subtitle
                    the other two cards carry, which drops this card's price
                    block below theirs. Holding the header to the taller of the
                    two keeps all three price rows on one line. */}
                <div className="flex min-h-[66px] items-start justify-between gap-3">
                  <div>
                    <h3
                      className={cn(
                        "text-lg font-bold",
                        plan.featured ? "text-ran-text-on-dark" : "text-ran-text-on-light"
                      )}
                    >
                      {plan.name}
                    </h3>
                    {plan.choosable ? (
                      <ChannelChoice value={channel} onChange={setChannel} />
                    ) : (
                      <p
                        className={cn(
                          "mt-1 text-sm",
                          plan.featured
                            ? "text-ran-text-on-dark-muted"
                            : "text-ran-text-on-light-muted"
                        )}
                      >
                        {plan.channels}
                      </p>
                    )}
                  </div>

                  {plan.featured ? (
                    <span className="shrink-0 rounded-full bg-ran-text-on-dark px-3 py-1 text-xs font-bold text-ran-surface-dark">
                      הנבחרת
                    </span>
                  ) : null}
                </div>

                <div
                  className={cn(
                    "mt-6 border-t pt-5",
                    plan.featured ? "border-ran-glass-border-dark" : "border-ran-glass-border-light"
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-4xl font-extrabold leading-none",
                        plan.featured ? "text-ran-text-on-dark" : "text-ran-text-on-light"
                      )}
                    >
                      {plan.monthly}₪
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        plan.featured
                          ? "text-ran-text-on-dark-muted"
                          : "text-ran-text-on-light-muted"
                      )}
                    >
                      לחודש
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-2 text-sm",
                      plan.featured
                        ? "text-ran-text-on-dark-muted"
                        : "text-ran-text-on-light-muted"
                    )}
                  >
                    במקום <s>{plan.monthlyList}₪</s>
                  </p>

                  {/* Setup gets its own labelled row. Run together with the
                      monthly price on one line, the two "was" figures sit
                      next to two current ones and bidi reordering leaves the
                      reader guessing which struck number belongs to which. */}
                  <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
                    <span
                      className={
                        plan.featured
                          ? "text-ran-text-on-dark-muted"
                          : "text-ran-text-on-light-muted"
                      }
                    >
                      הקמה חד-פעמית
                    </span>
                    <span>
                      <span
                        className={cn(
                          "font-bold",
                          plan.featured ? "text-ran-text-on-dark" : "text-ran-text-on-light"
                        )}
                      >
                        {plan.setup}₪
                      </span>{" "}
                      <s
                        className={
                          plan.featured
                            ? "text-ran-text-on-dark-muted"
                            : "text-ran-text-on-light-muted"
                        }
                      >
                        {plan.setupList}₪
                      </s>
                    </span>
                  </div>
                </div>

                <ul
                  className={cn(
                    "mt-6 space-y-2.5 border-t pt-5",
                    plan.featured ? "border-ran-glass-border-dark" : "border-ran-glass-border-light"
                  )}
                >
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          plan.featured ? "text-ran-text-on-dark" : "text-ran-text-on-light"
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "text-sm",
                          plan.featured
                            ? "text-ran-text-on-dark-muted"
                            : "text-ran-text-on-light-muted"
                        )}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
            )
          })}
        </RevealGroup>

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
            כל המחירים לפני מע״מ · מחיר המייסדים מותנה בהתחייבות ל-12 חודשים · בתשלום שנתי מראש חודש נוסף חינם
          </p>
        </Reveal>
      </SectionContainer>
    </section>
  )
}
