// The business profile: everything the agents need to know about the business
// that is not already in the catalog. Stored as JSON in `tenants.settings.profile`
// (owners may already edit their own settings, so no new table or grant), and
// shaped here once so the form, the server action and the agent brief agree.
//
// Two entry points on purpose:
//   parseProfile    — lenient, for reading what is stored (never throws, fills defaults)
//   validateProfile — strict, for what a person submitted (explains the first problem)

export const DAYS = [
  { key: "sun", label: "ראשון" },
  { key: "mon", label: "שני" },
  { key: "tue", label: "שלישי" },
  { key: "wed", label: "רביעי" },
  { key: "thu", label: "חמישי" },
  { key: "fri", label: "שישי" },
  { key: "sat", label: "שבת" },
] as const

export type DayKey = (typeof DAYS)[number]["key"]
export type DayHours = { open: string; close: string }
export type Tone = "warm" | "professional" | "light"
export type AnswerMode = "always" | "after_hours"

export const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "warm", label: "חם", hint: "ידידותי ואישי, כמו מישהו שמכיר את הלקוח" },
  { value: "professional", label: "מקצועי", hint: "מנומס, ענייני ומסודר" },
  { value: "light", label: "קליל", hint: "קצר, נינוח ובגובה העיניים" },
]

export interface BusinessIdentity {
  businessName: string
  ownerName: string
  tagline: string
  city: string
}

export interface BusinessProfile {
  about: string
  hours: Record<DayKey, DayHours | null>
  hoursNote: string
  address: string
  directions: string
  phone: string
  email: string
  cancellation: string
  payment: string
  neverSay: string
  faq: { q: string; a: string }[]
  tone: Tone
  agentName: string
  answerMode: AnswerMode
  escalate: { price: boolean; angry: boolean; owner: boolean; bigDeal: boolean }
  bigDealThreshold: number
}

export interface ProfileForm {
  identity: BusinessIdentity
  profile: BusinessProfile
}

export const LIMITS = {
  businessName: 80,
  ownerName: 80,
  tagline: 120,
  city: 60,
  about: 800,
  hoursNote: 200,
  address: 200,
  directions: 300,
  phone: 30,
  email: 120,
  policy: 500,
  neverSay: 500,
  faqCount: 20,
  faqQuestion: 160,
  faqAnswer: 600,
  agentName: 30,
  threshold: 10_000_000,
} as const

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function emptyProfile(): BusinessProfile {
  return {
    about: "",
    hours: { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null },
    hoursNote: "",
    address: "",
    directions: "",
    phone: "",
    email: "",
    cancellation: "",
    payment: "",
    neverSay: "",
    faq: [],
    tone: "warm",
    agentName: "",
    answerMode: "always",
    escalate: { price: true, angry: true, owner: true, bigDeal: false },
    bigDealThreshold: 0,
  }
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/** Reads whatever is stored. Anything missing or malformed falls back to the
 *  default, so a half-filled or hand-edited row can never break the page. */
export function parseProfile(raw: unknown): BusinessProfile {
  const base = emptyProfile()
  if (!isObj(raw)) return base

  const hours = { ...base.hours }
  if (isObj(raw.hours)) {
    for (const { key } of DAYS) {
      const d = raw.hours[key]
      if (isObj(d) && typeof d.open === "string" && typeof d.close === "string" && TIME.test(d.open) && TIME.test(d.close) && d.open < d.close) {
        hours[key] = { open: d.open, close: d.close }
      }
    }
  }

  const faq = Array.isArray(raw.faq)
    ? raw.faq
        .filter(isObj)
        .map((item) => ({ q: text(item.q, LIMITS.faqQuestion), a: text(item.a, LIMITS.faqAnswer) }))
        .filter((item) => item.q && item.a)
        .slice(0, LIMITS.faqCount)
    : []

  const escalate = isObj(raw.escalate) ? raw.escalate : {}
  const threshold = Number(raw.bigDealThreshold)

  return {
    about: text(raw.about, LIMITS.about),
    hours,
    hoursNote: text(raw.hoursNote, LIMITS.hoursNote),
    address: text(raw.address, LIMITS.address),
    directions: text(raw.directions, LIMITS.directions),
    phone: text(raw.phone, LIMITS.phone),
    email: text(raw.email, LIMITS.email),
    cancellation: text(raw.cancellation, LIMITS.policy),
    payment: text(raw.payment, LIMITS.policy),
    neverSay: text(raw.neverSay, LIMITS.neverSay),
    faq,
    tone: TONES.some((t) => t.value === raw.tone) ? (raw.tone as Tone) : base.tone,
    agentName: text(raw.agentName, LIMITS.agentName),
    answerMode: raw.answerMode === "after_hours" ? "after_hours" : "always",
    escalate: {
      price: typeof escalate.price === "boolean" ? escalate.price : base.escalate.price,
      angry: typeof escalate.angry === "boolean" ? escalate.angry : base.escalate.angry,
      owner: typeof escalate.owner === "boolean" ? escalate.owner : base.escalate.owner,
      bigDeal: typeof escalate.bigDeal === "boolean" ? escalate.bigDeal : base.escalate.bigDeal,
    },
    bigDealThreshold: Number.isFinite(threshold) ? Math.min(LIMITS.threshold, Math.max(0, Math.round(threshold))) : 0,
  }
}

export type Validation = { ok: true; value: ProfileForm } | { ok: false; error: string }

/** Checks what a person submitted. Over-long text is refused with a message
 *  (not silently cut), and the first problem found is the one reported. */
export function validateProfile(input: unknown): Validation {
  if (!isObj(input) || !isObj(input.identity) || !isObj(input.profile)) return { ok: false, error: "הנתונים לא הגיעו כמו שצריך. נסו לטעון את הדף מחדש." }
  const id = input.identity
  const p = input.profile

  const bounded = (value: unknown, max: number, label: string): string | { error: string } => {
    if (value === undefined || value === null || value === "") return ""
    if (typeof value !== "string") return { error: `${label}: ערך לא תקין` }
    const trimmed = value.trim()
    return trimmed.length > max ? { error: `${label} ארוך מדי (עד ${max} תווים)` } : trimmed
  }

  const fields = {
    businessName: bounded(id.businessName, LIMITS.businessName, "שם העסק"),
    ownerName: bounded(id.ownerName, LIMITS.ownerName, "שם בעל העסק"),
    tagline: bounded(id.tagline, LIMITS.tagline, "המשפט על העסק"),
    city: bounded(id.city, LIMITS.city, "העיר"),
    about: bounded(p.about, LIMITS.about, "התיאור"),
    hoursNote: bounded(p.hoursNote, LIMITS.hoursNote, "הערה לשעות"),
    address: bounded(p.address, LIMITS.address, "הכתובת"),
    directions: bounded(p.directions, LIMITS.directions, "הוראות הגעה"),
    phone: bounded(p.phone, LIMITS.phone, "הטלפון"),
    email: bounded(p.email, LIMITS.email, "המייל"),
    cancellation: bounded(p.cancellation, LIMITS.policy, "מדיניות הביטול"),
    payment: bounded(p.payment, LIMITS.policy, "אמצעי התשלום"),
    neverSay: bounded(p.neverSay, LIMITS.neverSay, "מה הסוכן לא אומר"),
    agentName: bounded(p.agentName, LIMITS.agentName, "שם הסוכן"),
  }
  for (const value of Object.values(fields)) if (typeof value === "object") return { ok: false, error: value.error }
  const f = fields as Record<keyof typeof fields, string>

  if (f.businessName.length < 2) return { ok: false, error: "כתבו את שם העסק" }
  if (f.email && !EMAIL.test(f.email)) return { ok: false, error: "המייל לא נראה תקין" }

  const hours = emptyProfile().hours
  const rawHours = isObj(p.hours) ? p.hours : {}
  for (const { key, label } of DAYS) {
    const d = rawHours[key]
    if (d === null || d === undefined) continue
    if (!isObj(d) || typeof d.open !== "string" || typeof d.close !== "string" || !TIME.test(d.open) || !TIME.test(d.close)) {
      return { ok: false, error: `שעות יום ${label} לא תקינות` }
    }
    if (d.open >= d.close) return { ok: false, error: `ביום ${label} שעת הסגירה צריכה להיות אחרי הפתיחה` }
    hours[key] = { open: d.open, close: d.close }
  }

  const rawFaq = Array.isArray(p.faq) ? p.faq : []
  if (rawFaq.length > LIMITS.faqCount) return { ok: false, error: `אפשר עד ${LIMITS.faqCount} שאלות נפוצות` }
  const faq: { q: string; a: string }[] = []
  for (const [i, item] of rawFaq.entries()) {
    if (!isObj(item)) return { ok: false, error: `שאלה ${i + 1} לא תקינה` }
    const q = typeof item.q === "string" ? item.q.trim() : ""
    const a = typeof item.a === "string" ? item.a.trim() : ""
    if (!q && !a) continue // an empty row the person never filled in
    if (!q || !a) return { ok: false, error: `בשאלה ${i + 1} חסרה ${q ? "תשובה" : "שאלה"}` }
    if (q.length > LIMITS.faqQuestion) return { ok: false, error: `שאלה ${i + 1} ארוכה מדי (עד ${LIMITS.faqQuestion} תווים)` }
    if (a.length > LIMITS.faqAnswer) return { ok: false, error: `התשובה לשאלה ${i + 1} ארוכה מדי (עד ${LIMITS.faqAnswer} תווים)` }
    faq.push({ q, a })
  }

  if (!TONES.some((t) => t.value === p.tone)) return { ok: false, error: "בחרו טון דיבור" }
  if (p.answerMode !== "always" && p.answerMode !== "after_hours") return { ok: false, error: "בחרו מתי הסוכן עונה" }

  const e = isObj(p.escalate) ? p.escalate : {}
  const threshold = Number(p.bigDealThreshold ?? 0)
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > LIMITS.threshold) return { ok: false, error: "סכום העסקה הגדולה לא תקין" }

  return {
    ok: true,
    value: {
      identity: { businessName: f.businessName, ownerName: f.ownerName, tagline: f.tagline, city: f.city },
      profile: {
        about: f.about,
        hours,
        hoursNote: f.hoursNote,
        address: f.address,
        directions: f.directions,
        phone: f.phone,
        email: f.email,
        cancellation: f.cancellation,
        payment: f.payment,
        neverSay: f.neverSay,
        faq,
        tone: p.tone as Tone,
        agentName: f.agentName,
        answerMode: p.answerMode,
        escalate: { price: e.price === true, angry: e.angry === true, owner: e.owner === true, bigDeal: e.bigDeal === true },
        bigDealThreshold: Math.round(threshold),
      },
    },
  }
}

export interface ProgressItem {
  key: string
  label: string
  done: boolean
}

/** How ready the business is for the agents, counting only what a person has to
 *  fill in (tone and escalation always have a sensible default). */
export function profileProgress(profile: BusinessProfile, catalogCount: number): { percent: number; items: ProgressItem[] } {
  const items: ProgressItem[] = [
    { key: "about", label: "תיאור העסק", done: profile.about.length >= 20 },
    { key: "hours", label: "שעות פעילות", done: Object.values(profile.hours).some(Boolean) },
    { key: "contact", label: "כתובת ויצירת קשר", done: Boolean(profile.address || profile.phone || profile.email) },
    { key: "policies", label: "מדיניות ותשלום", done: Boolean(profile.cancellation || profile.payment) },
    { key: "faq", label: "לפחות 3 שאלות נפוצות", done: profile.faq.length >= 3 },
    { key: "catalog", label: "קטלוג עם פריט אחד לפחות", done: catalogCount >= 1 },
  ]
  return { percent: Math.round((items.filter((i) => i.done).length / items.length) * 100), items }
}
