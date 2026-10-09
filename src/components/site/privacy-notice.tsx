"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ShieldCheck } from "lucide-react"

import { SectionContainer } from "@/components/site/section-container"
import { handleGlareMove } from "@/lib/utils"

const STORAGE_KEY = "napuch:notice-seen"

/* The intro curtain (z-200) sweeps for 1.95s on a first visit. Opening the
   notice underneath it would have the two animations fight for the same
   moment, so it waits that long plus a beat; a returning visitor skips the
   curtain and gets it almost at once. */
const FIRST_VISIT_DELAY_MS = 2600
const RETURN_VISIT_DELAY_MS = 900

/**
 * The bottom-of-page privacy notice.
 *
 * It says what is true rather than what banners usually say: this site sets no
 * advertising or tracking cookies and loads no analytics, so there is nothing
 * to accept or refuse and no "approve measurement" choice to offer — one would
 * contradict section 5 of the privacy policy. The only things kept in the
 * browser are technical flags (the intro-curtain marker and this notice's own
 * dismissal). If measurement is ever added, this is the component that has to
 * grow a real accept / essential-only choice, and the policy has to change with
 * it.
 */
export function PrivacyNotice() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  // Already reading the policy; covering its footer with a notice that links to
  // it would be circular.
  const onPolicyPage = pathname === "/privacy"

  useEffect(() => {
    if (onPolicyPage) return

    /* Everything touching storage or the DOM happens inside the timer callback
       rather than the effect body, so the first client render matches the
       server (nothing) and no setState runs synchronously in the effect. */
    const returning = document.documentElement.dataset.curtain === "skip"
    const timer = window.setTimeout(
      () => {
        let seen = false
        try {
          seen = localStorage.getItem(STORAGE_KEY) === "1"
        } catch {
          /* Storage blocked: show the notice every visit rather than guess. */
        }
        if (!seen) setIsOpen(true)
      },
      returning || prefersReducedMotion ? RETURN_VISIT_DELAY_MS : FIRST_VISIT_DELAY_MS
    )
    return () => window.clearTimeout(timer)
  }, [onPolicyPage, prefersReducedMotion])

  const dismiss = () => {
    setIsOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* Private browsing can refuse the write; the notice just returns next
         visit. Not worth surfacing. */
    }
  }

  return (
    <AnimatePresence>
      {isOpen && !onPolicyPage && (
        <motion.div
          role="region"
          aria-label="הודעה על פרטיות"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 260, damping: 26, mass: 0.9 }
          }
          className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SectionContainer className="max-w-[1140px] px-0">
            <div
              className="nav-pill relative overflow-hidden rounded-[28px]"
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              {/* The same marching-dashes strip that runs under the CRM
                  window: "data in motion", here as the notice's one signature
                  rather than another decorative layer. Drawn by CSS, so it is
                  already stilled under prefers-reduced-motion. */}
              <div
                aria-hidden
                className="crm-flow-line absolute inset-x-0 top-0 h-[3px]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, var(--text-strong) 0px, var(--text-strong) 16px, transparent 16px, transparent 32px)",
                  opacity: 0.85,
                }}
              />

              <div className="flex flex-col gap-5 px-5 pb-5 pt-6 md:flex-row md:items-center md:justify-between md:gap-8 md:px-7 md:py-5">
                {/* First in the DOM, so it sits on the right in RTL. */}
                {/* On a phone the icon shares a row with the title and the body
                    takes the full width beneath; from md up the icon spans
                    both rows and the copy sits beside it. A flex row with the
                    icon always beside the copy squeezed the paragraph into
                    four short lines and ate 28% of the screen. */}
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 md:items-start md:gap-y-1">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center md:row-span-2 md:mt-0.5 md:h-11 md:w-11">
                    {!prefersReducedMotion && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-ran-text-on-light"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.35, 0], scale: [0.8, 1.18, 1.38] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                      />
                    )}
                    <span className="relative flex h-full w-full items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light shadow-[0_2px_14px_-6px_rgba(17,17,17,0.3)]">
                      <ShieldCheck className="h-[18px] w-[18px] md:h-5 md:w-5" />
                    </span>
                  </span>

                  <p className="text-[15px] font-bold text-ran-text-on-light">
                    האתר הזה לא עוקב אחריך
                  </p>
                  <p className="col-span-2 max-w-2xl text-[13.5px] leading-relaxed text-ran-text-on-light-muted md:col-span-1">
                    אין כאן עוגיות פרסום, פיקסלים או כלי מדידה. נשמרות בדפדפן רק הגדרות טכניות —
                    כמו זו שמונעת מאנימציית הפתיחה לחזור על עצמה.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={dismiss}
                    onPointerMove={handleGlareMove}
                    className="cta-glow rounded-full bg-ran-text-on-light px-7 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.97]"
                  >
                    הבנתי
                  </button>
                  <Link
                    href="/privacy"
                    className="rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised px-5 py-2.5 text-sm font-semibold text-ran-text-on-light transition-colors hover:bg-ran-surface-subtle"
                  >
                    מדיניות הפרטיות
                  </Link>
                </div>
              </div>
            </div>
          </SectionContainer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
