const TZ = "Asia/Jerusalem"
const NBSP = " "

const number = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 })

/** Hebrew writes the amount first and the sign after: "1,400 ₪". */
export function formatMoney(value: number): string {
  return `${number.format(Math.round(value))}${NBSP}₪`
}

/** Short form for tight tiles: ₪1.2M / ₪48K. */
export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${trim(value / 1_000_000, 2)}M${NBSP}₪`
  if (abs >= 10_000) return `${trim(value / 1_000, 1)}K${NBSP}₪`
  return formatMoney(value)
}

function trim(n: number, digits: number) {
  return Number(n.toFixed(digits)).toString()
}

export function formatPrice(price: number, suffix?: string): string {
  const base = formatMoney(price)
  return suffix && suffix !== "₪" ? `${base} ${suffix}` : base
}

const time = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
const dayShort = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, day: "numeric", month: "numeric" })
const dateLabel = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, day: "numeric", month: "short" })
const weekdayShort = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "short" })
const weekdayLong = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long" })
const monthLong = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, month: "long", year: "numeric" })
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })

export const formatTime = (iso: string) => time.format(new Date(iso))
export const formatDayShort = (iso: string) => dayShort.format(new Date(iso))
/** "14 באוק׳". */
export const formatDateLabel = (iso: string) => dateLabel.format(new Date(iso))
export const formatWeekdayShort = (iso: string) => weekdayShort.format(new Date(iso))
export const formatMonth = (iso: string) => monthLong.format(new Date(iso))
/** Calendar-day key (YYYY-MM-DD) in the business's timezone. */
export const toDayKey = (iso: string | Date) => dayKey.format(typeof iso === "string" ? new Date(iso) : iso)

/** "היום ב-14:00", "מחר ב-10:30", "יום שלישי ב-16:00". */
export function formatSlot(iso: string, nowIso: string): string {
  const diff = dayDiff(iso, nowIso)
  const day = diff === 0 ? "היום" : diff === 1 ? "מחר" : diff === -1 ? "אתמול" : weekdayLong.format(new Date(iso))
  return `${day} ב-${formatTime(iso)}`
}

export function dayDiff(iso: string, nowIso: string): number {
  const a = Date.parse(`${toDayKey(iso)}T00:00:00Z`)
  const b = Date.parse(`${toDayKey(nowIso)}T00:00:00Z`)
  return Math.round((a - b) / 86_400_000)
}

export function formatRelative(iso: string, nowIso: string): string {
  const mins = Math.round((Date.parse(nowIso) - Date.parse(iso)) / 60_000)
  if (mins < 1) return "עכשיו"
  if (mins < 60) return `לפני ${mins} דק׳`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `לפני ${hours} שע׳`
  const days = Math.round(hours / 24)
  if (days === 1) return "אתמול"
  if (days < 14) return `לפני ${days} ימים`
  return formatDayShort(iso)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
