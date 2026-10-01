import type { IndustryPack } from "../types"

// The fallback for any business without its own pack: sensible words, a short
// pipeline and three catalog slots the owner renames in onboarding.
export const generic: IndustryPack = {
  id: "generic",
  label: "עסק כללי",
  mode: "appointments",
  vocab: {
    person: "לקוח/ה",
    people: "לקוחות",
    booking: "פגישה",
    bookings: "פגישות",
    deal: "עסקה",
    dealsTitle: "עסקאות אחרונות",
    catalog: "שירותים",
    catalogItem: "שירות",
    revenue: "הכנסה שנסגרה",
    upcoming: "פגישות קרובות",
  },
  stages: [
    { id: "new", label: "פנייה חדשה", probability: 0.1 },
    { id: "talk", label: "בשיחה", probability: 0.3 },
    { id: "offer", label: "הצעה נשלחה", probability: 0.6 },
    { id: "approved", label: "אושר", probability: 0.9 },
    { id: "done", label: "נסגר ושולם", probability: 1 },
  ],
  bookedFromStage: 1,
  fields: [
    { key: "topic", label: "נושא הפנייה", icon: "tag", options: ["מידע ומחיר", "קביעת פגישה", "הצעת מחיר", "תמיכה"] },
    { key: "urgency", label: "דחיפות", icon: "clock", options: ["השבוע", "החודש", "גמיש"] },
    { key: "source", label: "איך שמע עלינו", icon: "users", options: ["אינסטגרם", "המלצה", "גוגל", "קמפיין"] },
  ],
  catalogIcon: "tag",
  valueFactor: 1,
  brand: {
    accent: "#4338ff",
    accent2: "#20796e",
    warm: "#f1e44a",
    ink: "#0d0d0d",
    bgFrom: "#d3d9ee",
    bgTo: "#e3eedf",
  },
  catalog: [
    { title: "שירות בסיסי", subtitle: "הכי נפוץ", price: 300, tags: ["בסיס"], meta: [{ label: "משך", value: "45 דק׳" }], photos: 0, status: "available", sent: 30 },
    { title: "שירות מורחב", subtitle: "כולל ליווי", price: 750, tags: ["מורחב"], meta: [{ label: "משך", value: "90 דק׳" }], photos: 0, status: "hot", sent: 24 },
    { title: "חבילה פרימיום", subtitle: "הכול כלול", price: 1800, tags: ["פרימיום"], meta: [{ label: "משך", value: "לפי צורך" }], photos: 0, status: "available", sent: 12 },
  ],
  appointmentLabels: ["פגישת היכרות", "פגישת הצעה", "מעקב"],
  slotMinutes: 45,
  openers: [
    "היי, אשמח למידע על {item}",
    "כמה עולה {item}?",
    "אפשר לקבוע לגבי {item} השבוע?",
    "ראיתי אתכם באינסטגרם, אשמח לפרטים על {item}",
  ],
  reply: "שלום! {item} — {price}. אפשר לתאם {slot}. מתאים?",
  confirm: "קבעתי ל{slot}. אשלח תזכורת.",
  close: "תודה! אם משהו משתנה, כתבו כאן.",
  tags: ["חם", "המלצה", "חוזר"],
  knowledge: ["שירותים ומחירים", "שעות פעילות", "שאלות נפוצות", "יומן פנוי", "פרטי יצירת קשר"],
}
