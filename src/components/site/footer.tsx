import Link from "next/link"

import { Logo } from "@/components/site/logo"
import { SectionContainer } from "@/components/site/section-container"

// Rooted at "/" rather than a bare "#…": the footer also renders on
// standalone pages like /privacy, where a bare hash just jumps around the
// current (wrong) page instead of going back to the homepage section.
const PAGE_LINKS = [
  { href: "/#agents", label: "הסוכנים" },
  { href: "/#dashboard", label: "הדשבורד" },
  { href: "/#process", label: "תהליך העבודה" },
  { href: "/#testimonials", label: "לקוחות" },
  { href: "/#faq", label: "שאלות נפוצות" },
]

const CONTACT_LINKS = [
  { href: "tel:0503610061", label: "050-361-0061" },
  { href: "mailto:hello@napuch.co.il", label: "hello@napuch.co.il" },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ran-glass-border-dark bg-ran-surface-dark py-14 text-ran-text-on-dark">
      <SectionContainer className="relative flex flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-sm space-y-4">
          <Logo height={26} onDark />
          <p className="text-sm text-ran-text-on-dark-muted">
            הסוכנים של נפוץ&apos; — סוכן AI קולי שעונה לשיחות, מסווג לידים וקובע תורים במקומכם
          </p>
        </div>

        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-ran-text-on-dark-muted">עמודים</p>
            <ul className="space-y-2 text-sm text-ran-text-on-dark-muted">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-ran-text-on-dark">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-ran-text-on-dark-muted">יצירת קשר</p>
            <ul className="space-y-2 text-sm text-ran-text-on-dark-muted">
              {CONTACT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    dir="ltr"
                    className="hover:text-ran-text-on-dark"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="relative mt-10 flex flex-col-reverse gap-4 border-t border-ran-glass-border-dark pt-6 text-xs text-ran-text-on-dark-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>© 2026 נפוץ&apos;. כל הזכויות שמורות.</p>
          <p>רן יוסף חיים אלגבסי · עוסק פטור 217369388</p>
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-ran-text-on-dark">
            מדיניות פרטיות
          </Link>
          <Link href="/terms" className="hover:text-ran-text-on-dark">
            תנאי שימוש
          </Link>
          <Link href="/accessibility" className="hover:text-ran-text-on-dark">
            הצהרת נגישות
          </Link>
        </div>
      </SectionContainer>
    </footer>
  )
}
