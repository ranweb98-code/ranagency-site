import { SectionContainer } from "@/components/site/section-container"

const PAGE_LINKS = [
  { href: "#automation", label: "שירותים" },
  { href: "#process", label: "תהליך העבודה" },
  { href: "#testimonials", label: "לקוחות" },
  { href: "#faq", label: "שאלות נפוצות" },
]

const SOCIAL_LINKS = [
  { href: "https://wa.me/972503610061", label: "וואטסאפ" },
  { href: "https://instagram.com", label: "אינסטגרם" },
  { href: "https://facebook.com", label: "פייסבוק" },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ran-glass-border-dark bg-ran-surface-dark py-14 text-ran-text-on-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(61,107,251,0.28),transparent_70%)]"
      />

      <SectionContainer className="relative flex flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="inline-flex items-center rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm">
            <video
              src="/videos/logo-signature.webm"
              autoPlay
              loop
              muted
              playsInline
              className="h-6 w-auto mix-blend-multiply md:h-7"
            />
          </div>
          <p className="text-sm text-ran-text-on-dark-muted">
            אוטומציות AI, בוטים חכמים ובניית אתרים לעסקים קטנים ובינוניים בישראל
          </p>
        </div>

        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-ran-text-on-dark-muted">עמודים</p>
            <ul className="space-y-2 text-sm text-ran-text-on-dark-muted">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-ran-text-on-dark">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-ran-text-on-dark-muted">עקבו אחרינו</p>
            <ul className="space-y-2 text-sm text-ran-text-on-dark-muted">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
        <p>© 2026 RanAgency. כל הזכויות שמורות.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-ran-text-on-dark">
            מדיניות פרטיות
          </a>
          <a href="#" className="hover:text-ran-text-on-dark">
            תנאי שימוש
          </a>
        </div>
      </SectionContainer>
    </footer>
  )
}
