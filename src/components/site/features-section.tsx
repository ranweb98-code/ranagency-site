import type { CSSProperties } from "react"
import {
  BarChart3,
  Clock,
  Languages,
  Palette,
  TrendingUp,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Clock,
    title: "הבוט שלך אף פעם לא ישן",
    description: "גם בלילה, גם בשבת, גם בחג — הלקוחות שלך יקבלו מענה מיידי בכל זמן",
  },
  {
    icon: TrendingUp,
    title: "חיסכון של עשרות שעות בחודש",
    description:
      "במקום לענות על אותן שאלות שוב ושוב, הבוט יעשה את זה בשבילך — ותתפנה להתמקד בגדילה",
  },
  {
    icon: UserCheck,
    title: "אף לקוח לא הולך לאיבוד",
    description:
      "כל פנייה נענית מיד, כל ליד נאסף, וכל הזדמנות מנוצלת — גם כשאתה לא זמין",
  },
  {
    icon: Languages,
    title: "מבין עברית טבעית",
    description:
      "הבוטים שלנו משתמשים בטכנולוגיית AI מתקדמת שמבינה עברית בצורה טבעית ומדויקת",
  },
  {
    icon: BarChart3,
    title: "דע הכל על הלקוחות שלך",
    description:
      "קבל דוחות מפורטים על שיחות, לידים, המרות וביצועים — ותקבל החלטות מבוססות דאטה",
  },
  {
    icon: Palette,
    title: "נראה מצוין, מרגיש מקצועי",
    description:
      "כל הבוטים והאתרים שלנו מעוצבים בצורה מודרנית ומקצועית שתשדר אמינות ויוקרה",
  },
]

// CSS custom properties aren't part of React.CSSProperties — this widens the
// type just enough to set them from inline style without an `any` cast.
type MarqueeVars = CSSProperties & Record<`--${string}`, string | number>

const DESKTOP_ROWS = Math.ceil(FEATURES.length / 2)
const MOBILE_ROWS = FEATURES.length

export function FeaturesSection() {
  return (
    <section className="overflow-hidden bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-sm font-semibold tracking-wide text-ran-primary">היתרונות שלנו</p>
          <h2
            className="font-bold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            למה עסקים בוחרים ב-RanAgency
          </h2>
        </Reveal>

        {/* Desktop / tablet — 2 columns, each row is an endless upward belt */}
        <div className="feature-marquee-window hidden h-[600px] md:block">
          <ul
            className="feature-marquee grid h-full grid-cols-2 gap-6"
            style={{ "--count": DESKTOP_ROWS, "--speed": "14s" } as MarqueeVars}
          >
            {FEATURES.map((feature, index) => (
              <li key={feature.title} style={{ "--index": Math.floor(index / 2) } as MarqueeVars}>
                <FeatureCard feature={feature} />
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile — single column belt; speed doubled to match the doubled row count */}
        <div className="feature-marquee-window h-[560px] md:hidden">
          <ul
            className="feature-marquee grid h-full grid-cols-1 gap-4"
            style={{ "--count": MOBILE_ROWS, "--speed": "28s" } as MarqueeVars}
          >
            {FEATURES.map((feature, index) => (
              <li key={feature.title} style={{ "--index": index } as MarqueeVars}>
                <FeatureCard feature={feature} />
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>
    </section>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  return (
    <div className="feature-marquee-card flex h-56 flex-col rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_2px_20px_-8px_rgba(20,20,26,0.12)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ran-primary to-ran-accent text-white">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-bold text-ran-text-on-light" style={{ fontSize: "var(--text-h3)" }}>
        {feature.title}
      </h3>
      <p
        className="mt-2 line-clamp-2 leading-relaxed text-ran-text-on-light-muted"
        style={{ fontSize: "var(--text-body)" }}
      >
        {feature.description}
      </p>
    </div>
  )
}
