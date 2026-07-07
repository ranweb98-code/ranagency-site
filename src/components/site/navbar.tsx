"use client"

import { useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { HelpCircle, Sparkles, Users, Workflow, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "#automation", label: "שירותים", icon: Sparkles },
  { href: "#process", label: "תהליך העבודה", icon: Workflow },
  { href: "#testimonials", label: "לקוחות", icon: Users },
  { href: "#faq", label: "שאלות נפוצות", icon: HelpCircle },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 40)
  })

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 md:top-6"
        style={{ willChange: "transform" }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.header
          className="flex w-full max-w-5xl items-center justify-between rounded-full border transition-[background-color,padding] duration-300"
          style={{
            borderColor: "var(--color-ran-glass-border-dark)",
            backgroundColor: isScrolled ? "rgba(10,10,12,0.72)" : "rgba(10,10,12,0.32)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px -12px rgba(0,0,0,0.45)",
            willChange: "backdrop-filter",
            isolation: "isolate",
          }}
          animate={{ paddingBlock: isScrolled ? 10 : 14 }}
        >
          <div className="flex w-full items-center justify-between gap-4 pl-3 pr-5 md:pl-4 md:pr-7">
            <a href="#" className="flex items-center rounded-2xl bg-white px-3 py-1.5 shadow-sm">
              <video
                src="/videos/logo-signature.webm"
                autoPlay
                loop
                muted
                playsInline
                // WebM alpha isn't honored by <video> in any browser — it
                // always renders opaque, and the baked-in matte is a light
                // lavender-gray (~#F9F8FB), not true white, so it never
                // quite vanished into this pill even with a solid white
                // backdrop (blending white-on-white is a no-op — multiply
                // doesn't help here, since it only darkens, and the pill is
                // already the lightest thing behind it). Brightness clips
                // that near-white matte up to true white instead.
                className="h-6 w-auto brightness-110 md:h-7"
              />
            </a>

            <nav className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-ran-text-on-dark-muted transition-colors hover:text-ran-text-on-dark"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <MagneticButton>
              <Button
                className="hidden rounded-full bg-gradient-to-l from-ran-primary to-ran-accent text-white hover:opacity-90 md:inline-flex"
                render={<a href="#contact" />}
                nativeButton={false}
              >
                קבע ייעוץ חינם
              </Button>
            </MagneticButton>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent shadow-[0_4px_16px_-4px_var(--color-ran-primary)] md:hidden"
              aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
            >
              <motion.span
                className="absolute h-[2px] w-4 rounded-full bg-white"
                animate={{ y: isOpen ? 0 : -5, rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="absolute h-[2px] w-4 rounded-full bg-white"
                animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.4 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute h-[2px] w-4 rounded-full bg-white"
                animate={{ y: isOpen ? 0 : 5, rotate: isOpen ? -45 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </div>
        </motion.header>

        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-4 top-[calc(100%+0.5rem)] flex flex-col gap-1 overflow-hidden rounded-3xl border p-3 md:hidden"
              style={{
                borderColor: "var(--color-ran-glass-border-dark)",
                backgroundColor: "rgba(10,10,12,0.55)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px -12px rgba(0,0,0,0.45)",
              }}
            >
              {NAV_LINKS.map((link, index) => {
                const Icon = link.icon
                return (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + index * 0.04 }}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2 text-base font-semibold text-ran-text-on-dark-muted transition-colors hover:bg-white/5 hover:text-ran-text-on-dark"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    {link.label}
                  </motion.a>
                )
              })}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 + NAV_LINKS.length * 0.04 }}
                className="mt-1 px-1 pb-1"
              >
                <Button
                  className="w-full rounded-full bg-gradient-to-l from-ran-primary to-ran-accent text-white"
                  render={<a href="#contact" onClick={() => setIsOpen(false)} />}
                  nativeButton={false}
                >
                  קבע ייעוץ חינם
                </Button>
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
