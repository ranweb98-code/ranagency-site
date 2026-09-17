"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"

import { Logo } from "@/components/site/logo"
import { handleGlareMove } from "@/lib/utils"

// Rooted at "/" rather than a bare "#…": the navbar also renders on
// standalone pages like /privacy, where a bare hash just jumps around the
// current (wrong) page instead of going back to the homepage section.
const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#agents", label: "הסוכנים" },
  { href: "/#dashboard", label: "הדשבורד" },
  { href: "/#testimonials", label: "לקוחות" },
  { href: "/#faq", label: "שאלות נפוצות" },
]

// Scrolling down past this much page travel is what arms the hide. Below it
// the pill always stays put, so small nudges near the top never flicker it.
const HIDE_AFTER = 120

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastY = useRef(0)
  const pillRef = useRef<HTMLDivElement>(null)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastY.current
    lastY.current = latest
    // Direction, not absolute position: down hides, any upward movement
    // brings it straight back so navigation is never more than a flick away.
    if (latest > previous && latest > HIDE_AFTER) setIsHidden(true)
    else if (latest < previous) setIsHidden(false)
  })

  // The mobile sheet hangs off the pill, so it must never be allowed to
  // slide off-screen while open.
  const hidden = isHidden && !isOpen

  // Liquid-glass glare that tracks the cursor within the pill, following the
  // reference technique: a radial gradient positioned via CSS custom
  // properties updated on every pointer move, revealed on hover.
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = pillRef.current?.getBoundingClientRect()
    if (!rect) return
    pillRef.current!.style.setProperty("--glare-x", `${event.clientX - rect.left}px`)
    pillRef.current!.style.setProperty("--glare-y", `${event.clientY - rect.top}px`)
  }

  return (
    <motion.div
      className="fixed inset-x-0 top-4 z-50 px-4"
      animate={{ y: hidden ? "-100%" : "0%", opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Never full-width, never flush with the edge — a floating island,
          centered at every breakpoint including mobile. */}
      <div className="relative mx-auto w-full max-w-[1140px]">
        <div
          ref={pillRef}
          onPointerMove={handlePointerMove}
          className="nav-pill flex h-[60px] items-center justify-between gap-3 rounded-full px-3 md:px-4"
          style={{
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <span className="nav-pill-glare" aria-hidden />

          {/* logo + links group — first in DOM, so it sits on the right in RTL */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              aria-label="נפוץ' — לראש הדף"
              className="flex items-center rounded-full px-3 py-2"
            >
              <Logo height={20} />
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-[14px] font-medium text-ran-text-on-light-muted transition-colors hover:bg-black/[0.04] hover:text-ran-text-on-light"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/#contact"
              onPointerMove={handleGlareMove}
              className="cta-glow rounded-full bg-ran-text-on-light px-[18px] py-2.5 text-sm font-bold text-white"
            >
              קבעו ייעוץ חינם
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ran-text-on-light transition-colors hover:bg-black/[0.04] md:hidden"
              aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
              aria-expanded={isOpen}
            >
              <motion.span
                className="absolute h-[2px] w-5 rounded-full bg-current"
                animate={{ y: isOpen ? 0 : -6, rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="absolute h-[2px] w-5 rounded-full bg-current"
                animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.4 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute h-[2px] w-5 rounded-full bg-current"
                animate={{ y: isOpen ? 0 : 6, rotate: isOpen ? -45 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                transformOrigin: "top center",
              }}
              className="nav-pill absolute inset-x-0 top-[calc(100%+10px)] flex flex-col gap-1 rounded-[28px] p-3 md:hidden"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl px-3 py-2.5 text-base font-medium text-ran-text-on-light-muted transition-colors hover:bg-black/[0.04] hover:text-ran-text-on-light"
                >
                  {link.label}
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
