import { AlertTriangle, TrendingUp, Wand2 } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"

interface UseCase {
  audience: string
  challenge: string
  solution: string
  result: string
}

const USE_CASES: UseCase[] = [
  {
    audience: "מסעדות ומעדניות",
    challenge: "מקבלים עשרות הודעות ביום על שעות פתיחה, תפריט, הזמנות ומיקום",
    solution: "בוט שיענה אוטומטית על כל השאלות, יאסוף הזמנות וישלח תפריט מעודכן",
    result:
      "חיסכון של 2-3 שעות ביום, אף לקוח לא יחכה בתור, והזמנות ימשיכו להגיע גם בשעות העומס",
  },
  {
    audience: "מכוני יופי וקוסמטיקה",
    challenge: "לקוחות מתקשרים ושולחים הודעות כל היום לקביעת תורים",
    solution: "בוט וואטסאפ שיאפשר קביעת תורים אוטומטית 24/7 עם Google Calendar",
    result:
      "הלקוחות קובעים תורים לבד, אתה מקבל התראה מיידית, ואין יותר פספוסים או תורים כפולים",
  },
  {
    audience: "עסקי שירותים ויועצים",
    challenge: "מבזבז זמן על מענה לפניות ראשוניות ותיאום פגישות",
    solution: "בוט שיאסוף פרטים, יענה על שאלות נפוצות ויקבע פגישות ייעוץ אוטומטית",
    result: "רק לידים איכותיים מגיעים אליך, כבר עם כל הפרטים הרלוונטיים",
  },
  {
    audience: "חנויות אונליין",
    challenge: "לקוחות שואלים על מוצרים, מחירים, זמני אספקה ומלאי",
    solution: "בוט שישלח קטלוג מוצרים, יענה על שאלות ויעדכן במבצעים",
    result: "המרה גבוהה יותר, פחות נטישת עגלה, ויותר מכירות",
  },
  {
    audience: "ניהול אספקה אוטומטי",
    challenge: "בעל עסק צריך לשלוח הודעות לספק וללקוחות כל יום",
    solution: "בוט ששולח הודעות לכל הלקוחות, אוסף תשובות, שולח סיכום לבעל העסק ורשימה לספק",
    result: "חיסכון של 56 דקות ביום = 28 שעות בחודש",
  },
  {
    audience: "סוכנויות נדל\"ן",
    challenge: "מתקשרים ושואלים על נכסים, מחירים וזמינות לצפייה בכל שעה",
    solution: "בוט ששולח פרטי נכסים, תמונות ומחירים, ומתאם צפיות בלוח הזמנים שלך אוטומטית",
    result: "יותר צפיות בפועל, פחות זמן על מענה טלפוני, ולידים ממוינים לפי רצינות",
  },
]

const ROWS = [
  { key: "challenge" as const, label: "האתגר", icon: AlertTriangle, color: "text-ran-text-on-light-muted" },
  { key: "solution" as const, label: "הפתרון", icon: Wand2, color: "text-ran-primary" },
  { key: "result" as const, label: "התוצאה", icon: TrendingUp, color: "text-ran-accent" },
]

export function UseCasesSection() {
  return (
    <section id="use-cases" className="bg-ran-surface-light py-24">
      <SectionContainer>
        <Reveal className="mb-14 space-y-3 text-center">
          <p className="text-sm font-semibold tracking-wide text-ran-primary">דוגמאות שימוש</p>
          <h2
            className="font-bold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.015em" }}
          >
            איך זה עוזר בפועל
          </h2>
        </Reveal>

        <RevealGroup className="grid gap-6 lg:grid-cols-2">
          {USE_CASES.map((useCase) => (
            <RevealItem
              key={useCase.audience}
              className="rounded-3xl border border-ran-glass-border-light bg-ran-surface-light-raised p-6 shadow-[0_2px_20px_-8px_rgba(20,20,26,0.1)]"
            >
              <h3
                className="font-bold text-ran-text-on-light"
                style={{ fontSize: "var(--text-h3)" }}
              >
                {useCase.audience}
              </h3>
              <dl className="mt-4 space-y-3">
                {ROWS.map((row) => {
                  const Icon = row.icon
                  return (
                    <div key={row.key} className="flex gap-3 border-r-2 border-ran-glass-border-light pr-3">
                      <dt className={`flex shrink-0 items-center gap-1.5 font-semibold ${row.color}`} style={{fontSize: "var(--text-caption)"}}>
                        <Icon className="h-3.5 w-3.5" />
                        {row.label}
                      </dt>
                      <dd
                        className="text-ran-text-on-light-muted"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {useCase[row.key]}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </RevealItem>
          ))}
        </RevealGroup>
      </SectionContainer>
    </section>
  )
}
