import type { CSSProperties } from "react"

import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"

interface Testimonial {
  quote: string
  name: string
  role: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "הבוט לקח על עצמו את המענה לשאלות החוזרות, ופינה לנו זמן לעבוד במקום להקליד אותן תשובות שוב ושוב.",
    name: "דני כהן",
    role: "בעלי מסעדת השף",
  },
  {
    quote:
      "סוף סוף אני יכול להתמקד בלקוחות שנמצאים אצלי בקליניקה בלי לדאוג מהודעות שלא נענו. הבוט עושה את העבודה מצוין!",
    name: "שרה לוי",
    role: "קוסמטיקאית",
  },
  {
    quote:
      "סוכן האינסטגרם עונה ללקוחות תוך שניות במקום שעות, והפניות שמגיעות אלינו כבר מסודרות עם כל הפרטים. ממליץ בחום!",
    name: "קובה אליהו",
    role: "בעלי חנות אונליין",
  },
  {
    quote: "השירות מקצועי, היחס אישי, והתוצאה מדהימה. קיבלנו בדיוק מה שרצינו ובזמן שיא.",
    name: "רחל מזרחי",
    role: "מנכ״לית חברת ייעוץ",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="overflow-hidden bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">לקוחות מספרים</p>
          <h2
            className="font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            מה שהלקוחות שלנו אומרים
          </h2>
        </Reveal>
      </SectionContainer>

      <div className="testimonial-stage" style={{ "--count": TESTIMONIALS.length } as CSSProperties}>
        <div className="testimonial-ring">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={testimonial.name} className="testimonial-tile" style={{ "--i": index } as CSSProperties}>
              <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_16px_40px_-16px_rgba(17,17,17,0.25)]">
                <blockquote className="line-clamp-6 text-sm leading-relaxed text-ran-text-on-light">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ran-glass-border-light bg-ran-surface-subtle text-sm font-bold text-ran-text-on-light">
                    {testimonial.name.charAt(0)}
                  </span>
                  <span>
                    <p className="text-sm font-bold text-ran-text-on-light">{testimonial.name}</p>
                    <p className="text-xs text-ran-text-on-light-muted">{testimonial.role}</p>
                  </span>
                </figcaption>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
