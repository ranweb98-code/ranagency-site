import { formatPrice, formatSlot, toDayKey } from "./format"
import { PACKS } from "./industries"
import type {
  Appointment,
  CatalogItem,
  Channel,
  Contact,
  CrmData,
  IndustryPack,
  Message,
  Temperature,
  TimelineEvent,
  Tenant,
} from "./types"

// Deterministic demo data. Seeded by the tenant slug so a showcase tenant looks
// the same on every visit and on the server and the client alike, while every
// timestamp is relative to "now" so the dashboard never looks stale. This file
// is the only place that knows the data is fake — `repository.ts` is what the
// pages talk to, and it is what gets swapped for Supabase.

const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const TZ = "Asia/Jerusalem"

const FEMALE_NAMES = [
  { he: "מאיה כהן", en: "maya.cohen" },
  { he: "נועה ברק", en: "noa.barak" },
  { he: "שירה גל", en: "shira.gal" },
  { he: "תמר אביב", en: "tamar.aviv" },
  { he: "הדס דהן", en: "hadas.dahan" },
  { he: "מורן אדרי", en: "moran.adri" },
  { he: "דנה אשכנזי", en: "dana.ashkenazi" },
  { he: "קרן אוחיון", en: "keren.ohayon" },
  { he: "רותם פינטו", en: "rotem.pinto" },
  { he: "יעל סגל", en: "yael.segal" },
  { he: "מיכל עמר", en: "michal.amar" },
  { he: "שני וקנין", en: "shani.vaknin" },
  { he: "אורית בן דוד", en: "orit.bendavid" },
  { he: "ליאת סבן", en: "liat.saban" },
  { he: "טל חיון", en: "tal.hayon" },
  { he: "גלית מור", en: "galit.mor" },
  { he: "רוני שפירא", en: "roni.shapira" },
  { he: "עדי פרידמן", en: "adi.friedman" },
  { he: "סיון לביא", en: "sivan.lavi" },
  { he: "הילה נחמיאס", en: "hila.nachmias" },
]

const MALE_NAMES = [
  { he: "עידן לוי", en: "idan.levi" },
  { he: "אלון שרון", en: "alon.sharon" },
  { he: "יובל מזרחי", en: "yuval.mizrahi" },
  { he: "רון פרידמן", en: "ron.friedman" },
  { he: "איתי רוזן", en: "itay.rosen" },
  { he: "ליאור שמש", en: "lior.shemesh" },
  { he: "גיל חזן", en: "gil.hazan" },
  { he: "עומר ביטון", en: "omer.biton" },
  { he: "אורי נחום", en: "uri.nahum" },
  { he: "ניר אלמוג", en: "nir.almog" },
  { he: "תום הרשקוביץ", en: "tom.hershko" },
  { he: "אסף גולן", en: "asaf.golan" },
]

/** Packs whose customers are, in practice, women get women's names — a bridal
 *  shop full of "רון" and "אלון" reads as careless in a demo. */
const FEMALE_ONLY = new Set(["makeup", "nails", "bridal"])
// Interleave so a mixed list never shows three of one gender in a row.
const MIXED_NAMES = FEMALE_NAMES.flatMap((f, i) => (MALE_NAMES[i] ? [f, MALE_NAMES[i]] : [f]))

const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "וואטסאפ",
  instagram: "אינסטגרם",
  voice: "טלפון",
}

const FOLLOW_UPS = ["אחשוב על זה ואחזור אליכם", "אפשר עוד קצת פרטים?", "תודה, אחזור אליכם"]
const AGREEMENTS = ["מתאים לי, קבעו", "סגור, תודה!", "מעולה, אשמח"]

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (ms: number) => new Date(ms).toISOString()

/** A wall-clock time in Israel on a given calendar day, as epoch ms. */
function zonedTime(dayKey: string, hour: number, minute: number): number {
  const guess = Date.parse(`${dayKey}T${pad(hour)}:${pad(minute)}:00Z`)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(guess)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"))
  return guess - (asLocal - guess)
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "")
}

type Won = "recent" | "older" | "history" | null

/** How long ago the "history" deals closed, in days: a business that has been
 *  running for months, so the revenue chart has a real shape to show. They are
 *  appended last so every earlier contact keeps exactly the values it had. */
const HISTORY_DAYS = [64, 76, 90, 103, 118, 131, 145, 156, 164, 172]
const HISTORY_RANKS = [3, 4, 3, 4, 4, 3, 4, 4, 3, 4]

function stagePlan(pack: IndustryPack): { index: number; won: Won }[] {
  const last = pack.stages.length - 1
  const counts = [4, 3, 2, 1, 1, 1].slice(0, last)
  const plan: { index: number; won: Won }[] = []
  counts.forEach((count, index) => {
    for (let i = 0; i < count; i++) plan.push({ index, won: null })
  })
  for (let i = 0; i < 4; i++) plan.push({ index: last, won: "recent" })
  for (let i = 0; i < 3; i++) plan.push({ index: last, won: "older" })
  for (let i = 0; i < HISTORY_DAYS.length; i++) plan.push({ index: last, won: "history" })
  return plan
}

export function generateCrmData(tenant: Tenant, now: Date = new Date()): CrmData {
  const pack = PACKS[tenant.industry]
  const rand = mulberry32(hash(tenant.slug))
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]
  const nowMs = now.getTime()
  const nowIso = now.toISOString()
  const last = pack.stages.length - 1

  const catalog: CatalogItem[] = pack.catalog.map((seed, i) => ({ ...seed, id: `${tenant.slug}-c${i}` }))
  const openCatalog = catalog.filter((c) => c.status !== "sold")
  const firstName = tenant.ownerName.replace(/^ד״ר\s+/, "").split(" ")[0]

  const plan = stagePlan(pack)
  const byPrice = [...catalog].sort((a, b) => (b.dealValue ?? b.price) - (a.dealValue ?? a.price))
  let recentSeen = 0
  let olderSeen = 0
  let historySeen = 0
  const NAMES = FEMALE_ONLY.has(pack.id) ? FEMALE_NAMES : MIXED_NAMES
  const nameOffset = hash(tenant.slug) % NAMES.length
  const contacts: Contact[] = []
  const appointments: Appointment[] = []
  let apptCount = 0

  plan.forEach(({ index, won }, i) => {
    const id = `${tenant.slug}-${i + 1}`
    const person = NAMES[(i + nameOffset) % NAMES.length]
    const channel = tenant.agents[Math.floor(rand() * tenant.agents.length)]
    const stage = pack.stages[index]
    const isWon = index === last
    // Won deals are drawn from the price-ranked catalog at fixed ranks, so the
    // month's revenue is representative of the business (not a lucky or unlucky
    // roll) and recent vs. older months compare sensibly. Open deals rotate
    // through the catalog so no two neighbours ask about the same thing.
    const wonRank = won === "recent" ? [1, 3, 2, 4][recentSeen] : won === "older" ? [1, 2, 4][olderSeen] : won === "history" ? HISTORY_RANKS[historySeen] : -1
    if (won === "recent") recentSeen++
    if (won === "older") olderSeen++
    const historyDays = won === "history" ? HISTORY_DAYS[historySeen] : 0
    if (won === "history") historySeen++
    const item = isWon ? byPrice[wonRank % byPrice.length] : openCatalog[(i + nameOffset) % openCatalog.length]

    const fields: Record<string, string> = {}
    for (const field of pack.fields) fields[field.key] = pick(field.options)

    let value = item.dealValue ?? item.price * pack.valueFactor
    if (pack.valueByField && item.priceSuffix === "לסועד") value *= Number(fields[pack.valueByField]) || 1
    value = Math.round(value / 10) * 10

    // ── timestamps ───────────────────────────────────────────────────────
    let createdMs: number
    let lastMs: number
    let closedMs: number | undefined
    if (won === "history") {
      closedMs = nowMs - (historyDays + (rand() - 0.5) * 6) * DAY
      createdMs = closedMs - (8 + rand() * 18) * DAY
      lastMs = closedMs
    } else if (won === "older") {
      createdMs = nowMs - (62 + rand() * 18) * DAY
      closedMs = nowMs - (35 + rand() * 23) * DAY
      lastMs = closedMs
    } else if (won === "recent") {
      createdMs = nowMs - (30 + rand() * 25) * DAY
      closedMs = nowMs - (1 + rand() * 25) * DAY
      lastMs = closedMs
    } else if (index === 0) {
      // Fresh leads: the first two are minutes old so the inbox feels alive.
      const age = i < 2 ? (i === 0 ? 14 : 58) * MIN : (3 + rand() * 66) * HOUR
      createdMs = nowMs - age
      lastMs = nowMs - Math.min(age, (8 + rand() * 60) * MIN)
    } else {
      createdMs = nowMs - (index * 3 + 1 + rand() * 4) * DAY
      lastMs = nowMs - (0.2 + rand() * 2.6) * DAY
    }

    // ── who is handling it ───────────────────────────────────────────────
    const handledBy = !isWon && index >= 1 && index < last && rand() < 0.22 ? "human" : "agent"
    const unread = !isWon && index <= 1 && rand() > 0.45 ? 1 + Math.floor(rand() * 3) : 0

    const temperature: Temperature = isWon || index >= pack.bookedFromStage ? "hot" : pick<Temperature>(["hot", "warm", "warm", "cold", "cold"])

    // ── appointment ──────────────────────────────────────────────────────
    let appointmentAt: number | undefined
    if (index >= pack.bookedFromStage) {
      const past = isWon || index >= Math.ceil(last / 1.6)
      const offsets = [0, 0, 1, 1, 2, 3, 3, 4, 6, 7, 9, 10, 12]
      const dayOffset = past ? -(1 + Math.floor(rand() * 13)) : offsets[apptCount % offsets.length]
      const hour = pick([9, 10, 11, 12, 14, 15, 16, 17, 18])
      const minute = pick([0, 30])
      const dayKey = toDayKey(new Date(nowMs + dayOffset * DAY))
      appointmentAt = zonedTime(dayKey, hour, minute)
      apptCount += past ? 0 : 1
      appointments.push({
        id: `${id}-a`,
        contactId: id,
        at: toIso(appointmentAt),
        label: pack.appointmentLabels[i % pack.appointmentLabels.length],
        status: !past && index === pack.bookedFromStage && rand() < 0.3 ? "pending" : "confirmed",
      })
    }

    // A second visit on the books for most booked contacts — a real week has
    // follow-ups, check-ins and repeat visits, not one slot per person.
    if (appointmentAt && (!isWon || rand() < 0.5)) {
      const dayKey = toDayKey(new Date(nowMs + (2 + Math.floor(rand() * 24)) * DAY))
      appointments.push({
        id: `${id}-a2`,
        contactId: id,
        at: toIso(zonedTime(dayKey, pick([9, 10, 11, 13, 15, 16, 17]), pick([0, 30]))),
        label: pack.appointmentLabels[(i + 1) % pack.appointmentLabels.length],
        status: "confirmed",
      })
    }

    // ── conversation ─────────────────────────────────────────────────────
    const firstReplySeconds = 4 + Math.floor(rand() * 10)
    const slotIso = appointmentAt ? toIso(appointmentAt) : toIso(zonedTime(toDayKey(new Date(nowMs + DAY)), 14, 0))
    const vars = {
      item: item.title,
      price: formatPrice(item.price, item.priceSuffix),
      slot: formatSlot(slotIso, nowIso),
      name: person.he.split(" ")[0],
    }

    const messages: Message[] = []
    const push = (from: Message["from"], text: string, atMs: number, attachmentItemId?: string) =>
      messages.push({ id: `${id}-m${messages.length + 1}`, from, text, at: toIso(Math.min(atMs, nowMs)), attachmentItemId })

    push("customer", fill(pick(pack.openers), vars), createdMs)
    const sendsMedia = item.photos > 0 && (pack.mode === "listings" || rand() > 0.35)
    push("agent", fill(pack.reply, vars), createdMs + firstReplySeconds * 1000, sendsMedia ? item.id : undefined)
    if (index >= pack.bookedFromStage) {
      push("customer", pick(AGREEMENTS), createdMs + (60 + rand() * 120) * 1000)
      push("agent", fill(pack.confirm, vars), createdMs + (70 + rand() * 120) * 1000 + firstReplySeconds * 1000)
      push("agent", fill(pack.close, vars), createdMs + 5 * MIN)
    } else {
      const followUp = pick(FOLLOW_UPS)
      push("customer", followUp, createdMs + (3 + rand() * 30) * MIN)
      if (followUp !== FOLLOW_UPS[2]) {
        push("agent", "בטח, אני כאן לכל שאלה. אפשר גם להשאיר טלפון ונחזור אליכם.", createdMs + (4 + rand() * 30) * MIN)
      }
    }
    if (handledBy === "human") {
      push("human", `היי, כאן ${firstName}. ראיתי שהתעניינת — אשמח לדבר 🙂`, Math.max(lastMs, createdMs + 10 * MIN))
    }

    // ── timeline ─────────────────────────────────────────────────────────
    const timeline: TimelineEvent[] = [
      { id: `${id}-t1`, at: toIso(createdMs), kind: "lead", text: `פנייה ראשונה התקבלה ב${CHANNEL_LABEL[channel]}` },
      { id: `${id}-t2`, at: toIso(createdMs + firstReplySeconds * 1000), kind: "agent", text: `הסוכן ענה תוך ${firstReplySeconds} שניות` },
    ]
    if (sendsMedia) {
      timeline.push({ id: `${id}-t3`, at: toIso(createdMs + (firstReplySeconds + 2) * 1000), kind: "media", text: `נשלחו תמונות: ${item.title}` })
    }
    if (appointmentAt) {
      timeline.push({
        id: `${id}-t4`,
        at: toIso(Math.min(createdMs + 6 * MIN, nowMs)),
        kind: "appointment",
        text: `${pack.vocab.booking} נקבע ל${formatSlot(toIso(appointmentAt), nowIso)}`,
      })
    }
    if (closedMs) {
      timeline.push({ id: `${id}-t5`, at: toIso(closedMs), kind: "money", text: `העסקה נסגרה · ${formatPrice(value)}` })
    } else if (index > pack.bookedFromStage) {
      timeline.push({ id: `${id}-t6`, at: toIso(lastMs), kind: "stage", text: `עבר לשלב: ${stage.label}` })
    }
    timeline.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

    const tags = [...pack.tags].sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 3))
    const summary =
      handledBy === "human"
        ? `ממתין לשיחה אישית · ${item.title}`
        : appointmentAt && !isWon
          ? `${item.title} · ${pack.vocab.booking} ${formatSlot(toIso(appointmentAt), nowIso)}`
          : `התעניינות ב${item.title}`

    contacts.push({
      id,
      name: person.he,
      phone: `05${pick([0, 2, 3, 4, 8])}-${100 + Math.floor(rand() * 900)}-${1000 + Math.floor(rand() * 9000)}`,
      email: `${person.en}@gmail.com`,
      channel,
      temperature,
      stageId: stage.id,
      value,
      itemId: item.id,
      createdAt: toIso(createdMs),
      lastContactAt: toIso(lastMs),
      closedAt: closedMs ? toIso(closedMs) : undefined,
      handledBy,
      unread,
      tags,
      fields,
      summary,
      messages,
      timeline,
      firstReplySeconds,
      callSeconds: channel === "voice" ? 90 + Math.floor(rand() * 310) : undefined,
    })
  })

  contacts.sort((a, b) => Date.parse(b.lastContactAt) - Date.parse(a.lastContactAt))
  appointments.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  return { tenant, pack, now: nowIso, basePath: `/crm/${tenant.slug}`, demo: true, contacts, appointments, catalog }
}
