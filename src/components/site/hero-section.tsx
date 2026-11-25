"use client"

import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { SectionContainer } from "@/components/site/section-container"
import { handleGlareMove } from "@/lib/utils"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ran-surface-light pb-24 pt-36 md:pb-32 md:pt-44">
      <SectionContainer className="relative flex flex-col items-center text-center">
        <p
          className="hero-rise [--d:0.1s] text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted"
        >
          הסוכן הקולי של נפוץ&apos;
        </p>

        {/* No entrance of its own: this headline is the page's largest paint, and
            the intro curtain sweeping away is already its reveal. */}
        <h1
          className="mt-5 max-w-4xl font-extrabold text-ran-text-on-light"
          style={{ fontSize: "var(--text-display)", letterSpacing: "-0.035em", lineHeight: 1.06 }}
        >
          אף לקוח לא הולך לאיבוד
          <br />
          בטלפון
        </h1>

        <p
          className="hero-rise [--d:0.3s] mt-6 max-w-xl text-ran-text-on-light-muted"
          style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.65 }}
        >
          סוכן קולי עונה במקומכם לכל שיחה, לכל סוג עסק — מסווג כל ליד כחם או קר, וקובע תורים
          אוטומטית. הכל זורם לדשבורד CRM אחד.
        </p>

        <div
          className="hero-rise [--d:0.4s] mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <MagneticButton>
            <Button
              size="lg"
              className="cta-glow rounded-full bg-ran-text-on-light px-9 text-white"
              render={<a href="#contact" />}
              nativeButton={false}
              onPointerMove={handleGlareMove}
            >
              קבעו ייעוץ חינם
            </Button>
          </MagneticButton>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-ran-glass-border-light bg-ran-surface-light-raised px-9 text-ran-text-on-light hover:bg-ran-surface-subtle"
            render={<a href="#agents" />}
            nativeButton={false}
          >
            איך זה עובד
          </Button>
        </div>

        <p
          className="hero-rise [--d:0.5s] mt-7 text-sm text-ran-text-on-light-muted"
        >
          מענה תוך שניות, 24/7 — גם בשבת, גם באמצע הלילה
        </p>
      </SectionContainer>
    </section>
  )
}
