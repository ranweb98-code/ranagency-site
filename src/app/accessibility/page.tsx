import type { Metadata } from "next"

import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { SectionContainer } from "@/components/site/section-container"

export const metadata: Metadata = {
  title: "הצהרת נגישות — נפוץ'",
  description: "הצהרת הנגישות של נפוץ' — התאמות הנגישות שבוצעו באתר וכיצד ניתן לפנות בנושא.",
}

const UPDATED_AT = "23 באוגוסט 2026"

interface Section {
  title: string
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    title: "1. מחויבותנו לנגישות",
    body: (
      <p>
        נפוץ&apos; רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל הציבור, לרבות אנשים עם
        מוגבלויות. אנו פועלים להנגיש את האתר <span dir="ltr">ranagency.online</span>{" "}
        בהתאם לחוק
        שוויון זכויות לאנשים עם מוגבלות, התשנ&quot;ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות
        (התאמות נגישות לשירות), תשע&quot;ג-2013, ותוך התייחסות לדרישות התקן הישראלי ת&quot;י 5568
        (המבוסס על הנחיות <span dir="ltr">WCAG 2.0</span> ברמה <span dir="ltr">AA</span>).
      </p>
    ),
  },
  {
    title: "2. התאמות הנגישות שבוצעו באתר",
    body: (
      <>
        <p>בין היתר, ננקטו באתר ההתאמות הבאות:</p>
        <ul>
          <li>אפשרות ניווט מלאה במקלדת בכל רכיבי האתר (תפריטים, טפסים, כרטיסיות ואקורדיונים).</li>
          <li>קישור &quot;דלג לתוכן הראשי&quot; המופיע בתחילת כל עמוד עבור משתמשי מקלדת וקוראי מסך.</li>
          <li>תיוג נגיש (<span dir="ltr">aria-label</span>) לשדות טופס, כפתורים ואייקונים, כולל לשדות שאינם מציגים תווית קבועה על גבי המסך.</li>
          <li>מבנה סמנטי של כותרות ואזורי דף (<span dir="ltr">landmarks</span>) המאפשר ניווט מהיר עם קוראי מסך.</li>
          <li>ניגודיות צבעים העומדת בדרישות התקן בין טקסט לרקע בכל רחבי האתר.</li>
          <li>תמיכה בהפחתת אנימציות עבור משתמשים עם רגישות לתנועה (<span dir="ltr">prefers-reduced-motion</span>).</li>
          <li>תוויות טקסט חלופיות לתרשימים ואיורים גרפיים באתר.</li>
          <li>התאמה מלאה לכיווניות RTL ולתמיכה בעברית.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. מגבלות ידועות",
    body: (
      <p>
        אנו עושים מאמץ מתמשך להנגיש את האתר בצורה הטובה ביותר, אך ייתכן שבחלקים מסוימים —
        בעיקר רכיבים גרפיים או אנימציות מורכבות — לא הושגה הנגשה מלאה ומושלמת בכל הדפדפנים
        וטכנולוגיות המסייעות. אנו ממשיכים לבחון ולשפר את נגישות האתר על בסיס קבוע.
      </p>
    ),
  },
  {
    title: "4. פנייה בנושא נגישות",
    body: (
      <p>
        נתקלת בבעיית נגישות באתר, או שיש לך הצעה לשיפור? נשמח שתפנה/י אלינו בכתובת{" "}
        <a href="mailto:hello@ranagency.co.il" className="font-semibold underline underline-offset-2">
          hello@ranagency.co.il
        </a>{" "}
        או דרך{" "}
        <a
          href="https://wa.me/972503610061"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          וואטסאפ
        </a>
        , ונטפל בפנייתך בהקדם האפשרי.
      </p>
    ),
  },
]

export default function AccessibilityStatementPage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-ran-surface-light">
      <Navbar />

      <section className="pb-24 pt-36 md:pb-32 md:pt-44">
        <SectionContainer className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">
            נפוץ&apos;
          </p>
          <h1
            className="mt-3 font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            הצהרת נגישות
          </h1>
          <p className="mt-3 text-sm text-ran-text-on-light-muted">עודכן לאחרונה: {UPDATED_AT}</p>

          <div className="mt-12 space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2
                  className="font-bold text-ran-text-on-light"
                  style={{ fontSize: "var(--text-h3)", letterSpacing: "-0.01em" }}
                >
                  {section.title}
                </h2>
                <div
                  className="prose-legal mt-3 space-y-3 leading-relaxed text-ran-text-on-light-muted"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      <Footer />
    </main>
  )
}
