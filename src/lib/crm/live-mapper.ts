import type { Json } from "@/lib/supabase/database.types"
import type { Tables } from "@/lib/supabase/rows"
import { PACKS } from "./industries"
import { parseProfile } from "./profile"
import type {
  Appointment,
  BrandTheme,
  CatalogItem,
  Channel,
  Contact,
  CrmData,
  IndustryId,
  IndustryPack,
  Message,
  Temperature,
  Tenant,
  TimelineEvent,
} from "./types"

// Rows from Supabase → the exact shapes the CRM screens already render. Pure
// (no I/O, no Date.now) so it can be checked against fixtures, and defensive:
// every enum-like column is validated, because a stale or hand-edited row must
// degrade to a sensible default rather than crash a page.

export type TenantRow = Omit<Tables<"tenants">, "ingest_key_hash">

export interface LiveRows {
  tenant: TenantRow
  contacts: Tables<"contacts">[]
  messages: Tables<"messages">[]
  timeline: Tables<"timeline_events">[]
  appointments: Tables<"appointments">[]
  catalog: Tables<"catalog_items">[]
}

const CHANNELS: readonly Channel[] = ["whatsapp", "instagram", "voice"]
const TEMPERATURES: readonly Temperature[] = ["hot", "warm", "cold"]
const ITEM_STATUS: readonly CatalogItem["status"][] = ["available", "hot", "reserved", "sold"]
const TIMELINE_KINDS: readonly TimelineEvent["kind"][] = ["lead", "agent", "stage", "media", "appointment", "money"]
const BRAND_KEYS: readonly (keyof BrandTheme)[] = ["accent", "accent2", "warm", "ink", "bgFrom", "bgTo"]
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Brand colours become inline CSS variables, so only plain hex is accepted. */
export function parseBrand(raw: Json): Partial<BrandTheme> {
  if (!isRecord(raw)) return {}
  const brand: Partial<BrandTheme> = {}
  for (const key of BRAND_KEYS) {
    const value = raw[key]
    if (typeof value === "string" && HEX.test(value)) brand[key] = value
  }
  return brand
}

function parseFields(raw: Json): Record<string, string> {
  if (!isRecord(raw)) return {}
  const fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") fields[key] = value
  return fields
}

function parseMeta(raw: Json): { label: string; value: string }[] {
  if (!Array.isArray(raw)) return []
  const meta: { label: string; value: string }[] = []
  for (const entry of raw) {
    if (isRecord(entry) && typeof entry.label === "string" && typeof entry.value === "string") {
      meta.push({ label: entry.label, value: entry.value })
    }
  }
  return meta
}

/** The logo is a file in the business's own folder of the catalog bucket. */
export function logoPath(tenantId: string, brand: Json): string | null {
  if (!isRecord(brand) || typeof brand.logo !== "string") return null
  return brand.logo.startsWith(`${tenantId}/logo-`) && /^[0-9a-f-]{36}\/logo-[A-Za-z0-9._-]{1,80}$/.test(brand.logo) ? brand.logo : null
}

export function resolvePack(industry: string, brand: Json): IndustryPack {
  const base = PACKS[industry as IndustryId] ?? PACKS.generic
  return { ...base, brand: { ...base.brand, ...parseBrand(brand) } }
}

export function buildCrmData(rows: LiveRows, ctx: { now: Date; photoUrl: (path: string) => string }): CrmData {
  const { tenant: t } = rows
  const pack = resolvePack(t.industry, t.brand)
  const firstStage = pack.stages[0].id
  const stageIds = new Set(pack.stages.map((s) => s.id))

  const tenant: Tenant = {
    slug: t.slug,
    businessName: t.business_name,
    ownerName: t.owner_name ?? "",
    industry: pack.id,
    tagline: t.tagline ?? "",
    city: t.city ?? "",
    planMonthly: t.plan_monthly,
    agents: t.agents.filter((a): a is Channel => (CHANNELS as readonly string[]).includes(a)),
    logoUrl: logoPath(t.id, t.brand) ? ctx.photoUrl(logoPath(t.id, t.brand) as string) : undefined,
  }

  const catalog: CatalogItem[] = rows.catalog.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle ?? "",
    price: Number(c.price),
    priceSuffix: c.price_suffix ?? undefined,
    tags: c.tags,
    meta: parseMeta(c.meta),
    photos: c.photos.length,
    photoUrls: c.photos.map(ctx.photoUrl),
    status: oneOf(c.status, ITEM_STATUS, "available"),
    sent: c.sent_count,
    dealValue: c.deal_value === null ? undefined : Number(c.deal_value),
  }))

  const messagesByContact = groupBy(rows.messages, (m) => m.contact_id)
  const timelineByContact = groupBy(rows.timeline, (e) => e.contact_id)

  const contacts: Contact[] = rows.contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    channel: oneOf(c.channel, CHANNELS, "whatsapp"),
    temperature: oneOf(c.temperature, TEMPERATURES, "warm"),
    // a stage that left the pack would otherwise break the pipeline and the card
    stageId: stageIds.has(c.stage_id) ? c.stage_id : firstStage,
    value: Number(c.value),
    itemId: c.item_id ?? "",
    createdAt: c.created_at,
    lastContactAt: c.last_contact_at,
    closedAt: c.closed_at ?? undefined,
    handledBy: c.handled_by === "human" ? "human" : "agent",
    unread: c.unread,
    tags: c.tags,
    fields: parseFields(c.fields),
    summary: c.summary ?? "",
    messages: (messagesByContact.get(c.id) ?? [])
      .map(
        (m): Message => ({
          id: m.id,
          from: m.author === "agent" || m.author === "human" ? m.author : "customer",
          text: m.body,
          at: m.at,
          attachmentItemId: m.attachment_item_id ?? undefined,
        }),
      )
      .sort(byAt),
    timeline: (timelineByContact.get(c.id) ?? [])
      .map((e): TimelineEvent => ({ id: e.id, at: e.at, text: e.text, kind: oneOf(e.kind, TIMELINE_KINDS, "lead") }))
      .sort(byAt),
    // 0 means "no agent reply recorded"; metrics skip it
    firstReplySeconds: c.first_reply_seconds ?? 0,
    callSeconds: c.call_seconds ?? undefined,
  }))
  contacts.sort((a, b) => Date.parse(b.lastContactAt) - Date.parse(a.lastContactAt))

  const appointments: Appointment[] = rows.appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({
      id: a.id,
      contactId: a.contact_id,
      at: a.starts_at,
      label: a.label,
      status: a.status === "pending" ? ("pending" as const) : ("confirmed" as const),
    }))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  return {
    tenant,
    pack,
    now: ctx.now.toISOString(),
    basePath: `/app/${t.slug}`,
    demo: false,
    contacts,
    appointments,
    catalog,
    profile: parseProfile(isRecord(t.settings) ? t.settings.profile : undefined),
  }
}

function byAt(a: { at: string }, b: { at: string }) {
  return Date.parse(a.at) - Date.parse(b.at)
}

function groupBy<T>(list: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of list) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}
