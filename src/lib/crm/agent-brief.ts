import { formatPrice } from "./format"
import { DAYS, TONES, type BusinessIdentity, type BusinessProfile } from "./profile"

export interface BriefCatalogItem {
  title: string
  subtitle: string
  price: number
  priceSuffix?: string
}

/** The business, written out the way an agent will be told about it. Today it is
 *  a preview (so the owner can see what the profile adds up to); it is also the
 *  single source the agents' instructions will be built from, so what the owner
 *  reads here is what the agent will know. Pure, so it runs live in the browser
 *  while the form is being edited. */
export function buildAgentBrief(opts: {
  identity: BusinessIdentity
  packLabel: string
  profile: BusinessProfile
  catalog: BriefCatalogItem[]
}): string {
  const { identity, packLabel, profile, catalog } = opts
  const lines: string[] = []
  const section = (title: string, body: string[]) => {
    const filled = body.filter(Boolean)
    if (filled.length) lines.push(`## ${title}`, ...filled, "")
  }

  lines.push(`# ${identity.businessName || "העסק"}`, "")
  section("על העסק", [
    packLabel ? `תחום: ${packLabel}` : "",
    identity.tagline,
    identity.city ? `עיר: ${identity.city}` : "",
    identity.ownerName ? `בעל העסק: ${identity.ownerName}` : "",
    profile.about,
  ])

  const hours = DAYS.map(({ key, label }) => {
    const d = profile.hours[key]
    return d ? `${label}: ${d.open}–${d.close}` : `${label}: סגור`
  })
  section("שעות פעילות", Object.values(profile.hours).some(Boolean) ? [...hours, profile.hoursNote] : [profile.hoursNote])

  section("כתובת ויצירת קשר", [
    profile.address ? `כתובת: ${profile.address}` : "",
    profile.directions ? `הגעה וחניה: ${profile.directions}` : "",
    profile.phone ? `טלפון: ${profile.phone}` : "",
    profile.email ? `מייל: ${profile.email}` : "",
  ])

  section("מדיניות", [
    profile.cancellation ? `ביטולים ושינויים: ${profile.cancellation}` : "",
    profile.payment ? `תשלום: ${profile.payment}` : "",
  ])

  section(
    "שאלות נפוצות",
    profile.faq.flatMap((item) => [`ש: ${item.q}`, `ת: ${item.a}`]),
  )

  section(
    "קטלוג ומחירים",
    catalog.map((item) => `- ${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}: ${formatPrice(item.price, item.priceSuffix)}`),
  )

  const tone = TONES.find((t) => t.value === profile.tone)
  const escalate = [
    profile.escalate.price ? "שאלה על מחיר חריג או הנחה" : "",
    profile.escalate.angry ? "לקוח כועס או מתלונן" : "",
    profile.escalate.owner ? "הלקוח מבקש לדבר עם בעל העסק" : "",
    profile.escalate.bigDeal && profile.bigDealThreshold > 0 ? `עסקה מעל ${formatPrice(profile.bigDealThreshold)}` : "",
  ].filter(Boolean)

  section("איך לדבר", [
    tone ? `טון: ${tone.label} (${tone.hint})` : "",
    profile.agentName ? `שם הסוכן: ${profile.agentName}` : "",
    profile.answerMode === "after_hours" ? "עונה רק מחוץ לשעות הפעילות" : "עונה בכל שעה",
    ...(escalate.length ? ["מעביר לבעל העסק כש:", ...escalate.map((e) => `- ${e}`)] : []),
    profile.neverSay ? `אסור לומר: ${profile.neverSay}` : "",
  ])

  return lines.join("\n").trim()
}
