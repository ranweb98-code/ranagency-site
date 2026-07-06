"use client"

import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { ConsultationCard } from "@/components/site/consultation-card"
import { SectionContainer } from "@/components/site/section-container"

interface FaqItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "כמה זמן לוקח לבנות בוט?",
    answer: "בוט בסיסי לוקח 3-7 ימי עבודה. בוט מתקדם עם אינטגרציות מורכבות יכול לקחת 2-3 שבועות.",
  },
  {
    question: "אתם גם בונים אתרים?",
    answer:
      "בהחלט! בנוסף לבוטים אנחנו בונים אתרים מודרניים, מהירים וממירים שמותאמים מושלם גם לנייד — בדיוק כמו האתר הזה שאתם גולשים בו עכשיו.",
  },
  {
    question: "האם אני צריך ידע טכני?",
    answer: "ממש לא! אנחנו בונים הכל ומדריכים אותך איך להשתמש. אם יש לך שאלות — אנחנו כאן.",
  },
  {
    question: "האם הבוט יבין עברית?",
    answer: "בהחלט! הבוטים שלנו משתמשים בטכנולוגיית AI מתקדמת שמבינה עברית טבעית בצורה מצוינת.",
  },
  {
    question: "מה קורה אם הבוט לא יודע לענות?",
    answer:
      "הבוט יכול להעביר את השיחה אליך ידנית, או לבקש מהלקוח להשאיר פרטים ואתה תחזור אליו.",
  },
  {
    question: "האם אני יכול לעדכן את הבוט אחרי ההקמה?",
    answer:
      "בטח! זה תלוי כמה זמן עבר מאז ההקמה — עדכונים בסמוך להשקה כלולים, ולפעמים בהמשך הדרך זה כרוך בתשלום נוסף. אפשר גם ללמוד לעשות חלק מהעדכונים בעצמך בהדרכה שאנחנו נותנים.",
  },
  {
    question: "האם זה עובד גם בשבת ובחג?",
    answer: "כן! הבוט עובד 24/7, 365 ימים בשנה — גם בשבת, גם בחג, גם באמצע הלילה.",
  },
  {
    question: "כמה זה עולה?",
    answer:
      "כל פרויקט הוא שונה. אנחנו מתאימים את הפתרון לצרכים שלך ונותנים הצעת מחיר מסודרת בייעוץ החינם.",
  },
  {
    question: "האם יש התחייבות חודשית?",
    answer:
      "תלוי בחבילה. חלק מהשירותים הם בתשלום חד-פעמי, ואחרים כוללים מנוי חודשי לתחזוקה ושירות.",
  },
]

export function CtaFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          {/* CTA card — animated gradient */}
          <Reveal>
            <ConsultationCard />
          </Reveal>

          {/* FAQ accordion */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 space-y-2 text-center lg:text-right">
              <p className="text-sm font-semibold tracking-wide text-ran-primary">שאלות נפוצות</p>
              <h3 className="font-bold text-ran-text-on-light" style={{ fontSize: "var(--text-h3)" }}>
                עוד לא בטוח? נענה לך
              </h3>
            </div>
            <RevealGroup className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index
                return (
                  <RevealItem key={item.question}>
                    <div
                      className={`rounded-2xl border bg-ran-surface-light-raised px-5 py-4 transition-all duration-200 ${
                        isOpen
                          ? "border-ran-primary/35 shadow-[0_4px_20px_-4px_rgba(61,107,251,0.25)]"
                          : "border-ran-glass-border-light shadow-[0_2px_12px_-6px_rgba(20,20,26,0.08)] hover:border-ran-primary/25"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-3 text-right"
                      >
                        <span
                          className="font-semibold text-ran-text-on-light"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-ran-primary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-ran-text-on-light-muted" />
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <p
                              className="mt-3 leading-relaxed text-ran-text-on-light-muted"
                              style={{ fontSize: "var(--text-body)" }}
                            >
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </RevealItem>
                )
              })}
            </RevealGroup>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
