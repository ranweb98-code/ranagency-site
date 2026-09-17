import type { Metadata } from "next"

import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { SectionContainer } from "@/components/site/section-container"

export const metadata: Metadata = {
  title: "תנאי שימוש — נפוץ'",
  description: "תנאי השימוש באתר נפוץ' — הזכויות, המגבלות והכללים שחלים על השימוש באתר.",
}

const UPDATED_AT = "23 באוגוסט 2026"

interface Section {
  title: string
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    title: "1. כללי",
    body: (
      <>
        <p>
          תנאי שימוש אלה חלים על הגלישה והשימוש באתר <span dir="ltr">ranagency.online</span>{" "}
          (&quot;האתר&quot;),
          המופעל על ידי נפוץ&apos; (&quot;אנחנו&quot;, &quot;החברה&quot;). כניסה לאתר ושימוש בו מהווים
          הסכמה מלאה לתנאים המפורטים להלן. אם אינך מסכימ/ה לתנאי השימוש, נבקש שלא להמשיך להשתמש
          באתר.
        </p>
        <p>התנאים מנוסחים בלשון זכר/נקבה מטעמי נוחות בלבד, ומיועדים לכל המגדרים כאחד.</p>
      </>
    ),
  },
  {
    title: "2. מהות השירות",
    body: (
      <p>
        האתר משמש כאתר תדמית ושיווק, המציג את שירותי נפוץ&apos; בתחום סוכני AI לוואטסאפ, אינסטגרם
        וטלפון, ומאפשר קביעת ייעוץ חינם באמצעות טופס יצירת קשר. האתר עצמו אינו מהווה פלטפורמה
        למכירה, לתשלום מקוון או להתקשרות אוטומטית — כל התקשרות עסקית בפועל (היקף השירות, מחיר,
        לוחות זמנים) תיסגר בנפרד, ישירות מולנו, ואינה כפופה לתנאי שימוש אלה בלבד.
      </p>
    ),
  },
  {
    title: "3. קניין רוחני",
    body: (
      <p>
        כל הזכויות באתר — לרבות עיצוב, טקסטים, לוגו, סימני המסחר, קוד המקור, גרפיקה ותכנים
        אחרים — שייכות לנפוץ&apos; או לצדדים שלישיים שהעניקו לנו רישיון להשתמש בהם, ומוגנות על פי
        דיני זכויות היוצרים והקניין הרוחני. אין להעתיק, לשכפל, להפיץ, לפרסם מחדש או לעשות כל
        שימוש מסחרי בתכני האתר ללא קבלת אישור מראש ובכתב מאיתנו.
      </p>
    ),
  },
  {
    title: "4. שימוש מותר באתר",
    body: (
      <>
        <p>בעת השימוש באתר את/ה מתחייב/ת:</p>
        <ul>
          <li>לא לעשות שימוש שיש בו כדי לפגוע בפעילות התקינה של האתר או בשרתים שמריצים אותו.</li>
          <li>לא לנסות לחדור באופן לא מורשה למערכות האתר או למידע שאינו מיועד לך.</li>
          <li>לא להעביר בטופס יצירת הקשר פרטים כוזבים או להתחזות לאדם או גוף אחר.</li>
          <li>לא לעשות שימוש אוטומטי (בוטים, איסוף מידע המוני וכדומה) באתר ללא אישור מראש.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. קישורים לאתרים חיצוניים",
    body: (
      <p>
        האתר עשוי לכלול קישורים לשירותים חיצוניים כגון וואטסאפ, אינסטגרם ופייסבוק. קישורים אלה
        מוצגים לנוחיותך בלבד, ואיננו אחראים לתוכן, לזמינות או למדיניות הפרטיות של אותם אתרים
        חיצוניים. השימוש בהם כפוף לתנאי השימוש ומדיניות הפרטיות שלהם.
      </p>
    ),
  },
  {
    title: "6. אחריות ומגבלת אחריות",
    body: (
      <>
        <p>
          התכנים באתר, לרבות תיאורי השירותים, מוצגים כפי שהם (&quot;<span dir="ltr">AS IS</span>&quot;)
          ולצרכי מידע כללי בלבד, ואינם מהווים הצעה מחייבת או התחייבות סופית מצידנו. אנו עושים
          מאמץ סביר לוודא שהמידע באתר מדויק ועדכני, אך איננו מתחייבים שהאתר יהיה נקי משגיאות או
          שיפעל ברציפות וללא תקלות.
        </p>
        <p>
          במידה המרבית המותרת על פי חוק, לא נהיה אחראים לכל נזק ישיר או עקיף שייגרם כתוצאה
          מהשימוש באתר או מהסתמכות על התכנים המוצגים בו.
        </p>
      </>
    ),
  },
  {
    title: "7. פרטיות",
    body: (
      <p>
        השימוש שלנו בפרטים שאת/ה מוסר/ת דרך האתר, לרבות בטופס יצירת הקשר, מפורט במלואו{" "}
        <a href="/privacy" className="font-semibold underline underline-offset-2">
          במדיניות הפרטיות והעוגיות
        </a>{" "}
        שלנו, המהווה חלק בלתי נפרד מתנאי שימוש אלה.
      </p>
    ),
  },
  {
    title: "8. שינויים בתנאי השימוש",
    body: (
      <p>
        אנו רשאים לעדכן תנאי שימוש אלה מעת לעת, בהתאם לשינויים באתר, בשירותים או בדרישות החוק.
        תאריך העדכון האחרון מופיע בראש העמוד. המשך שימוש באתר לאחר פרסום עדכון מהווה הסכמה
        לנוסח המעודכן.
      </p>
    ),
  },
  {
    title: "9. דין וסמכות שיפוט",
    body: (
      <p>
        על תנאי שימוש אלה יחולו דיני מדינת ישראל בלבד, וכל מחלוקת הנוגעת אליהם תידון בבתי המשפט
        המוסמכים בישראל בלבד.
      </p>
    ),
  },
  {
    title: "10. יצירת קשר",
    body: (
      <p>
        לכל שאלה בנוגע לתנאי שימוש אלה, ניתן לפנות אלינו בכתובת{" "}
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
        .
      </p>
    ),
  },
]

export default function TermsOfUsePage() {
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
            תנאי שימוש
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
