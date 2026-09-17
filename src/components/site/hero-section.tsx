"use client"

import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { TypewriterWord } from "@/components/ui/typewriter-word"
import { SectionContainer } from "@/components/site/section-container"
import { handleGlareMove } from "@/lib/utils"

// The shared "ב" prefix is rendered statically outside the typewriter, not
// baked into these words: with it included, the line went completely blank at
// the bottom of every delete cycle, leaving a visible hole under the headline.
const HERO_CHANNEL_WORDS = ["וואטסאפ", "אינסטגרם", "טלפון"]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ran-surface-light pb-24 pt-36 md:pb-32 md:pt-44">
      <SectionContainer className="relative flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted"
        >
          הסוכנים של נפוץ&apos;
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-4xl font-extrabold text-ran-text-on-light"
          style={{ fontSize: "var(--text-display)", letterSpacing: "-0.035em", lineHeight: 1.06 }}
        >
          אף לקוח לא הולך לאיבוד
          <br />
          ב
          <TypewriterWord words={HERO_CHANNEL_WORDS} srLabel="וואטסאפ, אינסטגרם וטלפון" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl text-ran-text-on-light-muted"
          style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.65 }}
        >
          שלושה סוכני AI עונים במקומכם בכל ערוץ — מסווגים כל ליד כחם או קר, וקובעים תורים
          אוטומטית. הכל זורם לדשבורד CRM אחד.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
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
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-7 text-sm text-ran-text-on-light-muted"
        >
          מענה תוך שניות, 24/7 — גם בשבת, גם באמצע הלילה
        </motion.p>
      </SectionContainer>
    </section>
  )
}
