import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { TiltCard } from "@/components/ui/tilt-card"

interface Testimonial {
  quote: string
  name: string
  role: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "הבוט חסך לנו לפחות 3 שעות ביום של מענה על שאלות חוזרות. ההשקעה החזירה את עצמה תוך שבועיים!",
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
      "האתר החדש והבוט לאינסטגרם הביאו לנו עלייה של 200% בפניות איכותיות. ממליץ בחום!",
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
    <section id="testimonials" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-sm font-semibold tracking-wide text-ran-primary">לקוחות מספרים</p>
          <h2
            className="font-bold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            מה שהלקוחות שלנו אומרים
          </h2>
        </Reveal>

        <RevealGroup className="grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <RevealItem key={testimonial.name}>
              <TiltCard className="rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_2px_20px_-8px_rgba(20,20,26,0.1)]">
                <blockquote
                  className="leading-relaxed text-ran-text-on-light"
                  style={{ fontSize: "var(--text-body-lg)" }}
                >
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ran-primary to-ran-accent text-sm font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </span>
                  <span>
                    <p className="text-sm font-bold text-ran-text-on-light">{testimonial.name}</p>
                    <p className="text-sm text-ran-text-on-light-muted">{testimonial.role}</p>
                  </span>
                </figcaption>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </SectionContainer>
    </section>
  )
}
