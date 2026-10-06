// The CRM's data model. Everything a business-specific CRM needs to look
// different (words, pipeline stages, extra fields, catalog, brand) lives in an
// IndustryPack — plain data, no components — so a new vertical is one file and
// never a fork of the UI. Tenants point at a pack and layer their own brand on
// top.
//
import type { BusinessProfile } from "./profile"

// Two sources fill these shapes: `demo-data.ts` generates the /crm showcase in
// code, and `live.ts` reads a real business from Supabase for /app. The screens
// never know which one they got.

export type Channel = "whatsapp" | "instagram" | "voice"
export type Temperature = "hot" | "warm" | "cold"

/** How the business earns: repeat bookings, one-off projects, or inventory. */
export type WorkMode = "appointments" | "projects" | "listings"

export type IndustryId =
  | "dental"
  | "chef"
  | "makeup"
  | "nails"
  | "bridal"
  | "realestate"
  | "fitness"
  | "contractor"
  | "generic"

/** Icons are referenced by key so packs stay serialisable server → client. */
export type IconKey =
  | "stethoscope"
  | "shield"
  | "calendar"
  | "users"
  | "map-pin"
  | "home"
  | "ruler"
  | "wallet"
  | "heart"
  | "utensils"
  | "leaf"
  | "sparkles"
  | "clock"
  | "tag"
  | "camera"
  | "dumbbell"
  | "hammer"
  | "building"
  | "gem"
  | "palette"
  | "phone"
  | "mail"

export interface Vocab {
  /** Singular noun for the end customer — "מטופל/ת", "כלה", "מתעניין/ת". */
  person: string
  people: string
  booking: string
  bookings: string
  deal: string
  /** Heading above the coloured recent-deal cards. */
  dealsTitle: string
  catalog: string
  catalogItem: string
  /** KPI label for confirmed money, e.g. "הכנסה שנסגרה" / "עמלות שנסגרו". */
  revenue: string
  /** Heading for the calendar-ish list of what's coming up. */
  upcoming: string
}

export interface Stage {
  id: string
  label: string
  /** Chance a deal in this stage closes — drives the weighted pipeline. */
  probability: number
}

export interface FieldDef {
  key: string
  label: string
  icon: IconKey
  options: string[]
}

export interface BrandTheme {
  accent: string
  accent2: string
  warm: string
  ink: string
  bgFrom: string
  bgTo: string
}

export interface CatalogSeed {
  title: string
  subtitle: string
  price: number
  priceSuffix?: string
  tags: string[]
  meta: { label: string; value: string }[]
  photos: number
  status: "available" | "hot" | "reserved" | "sold"
  /** How many times the agent has already sent this to a customer. */
  sent: number
  /** What a deal on this item is worth when that isn't the sticker price
   *  (a sale's commission, say). */
  dealValue?: number
}

export interface IndustryPack {
  id: IndustryId
  label: string
  mode: WorkMode
  vocab: Vocab
  stages: Stage[]
  /** First stage at which something is already on the calendar. */
  bookedFromStage: number
  fields: FieldDef[]
  catalog: CatalogSeed[]
  catalogIcon: IconKey
  /** Share of the catalog price that counts as the deal's value. */
  valueFactor: number
  /** A per-head price is multiplied by this custom field's value. */
  valueByField?: string
  brand: BrandTheme
  appointmentLabels: string[]
  slotMinutes: number
  openers: string[]
  reply: string
  confirm: string
  close: string
  tags: string[]
  /** What the agents are told about the business — shown on the agents page. */
  knowledge: string[]
}

export interface Tenant {
  slug: string
  businessName: string
  ownerName: string
  industry: IndustryId
  tagline: string
  city: string
  planMonthly: number
  agents: Channel[]
  /** The business's own logo, shown in the header instead of an initial. */
  logoUrl?: string
}

export interface CatalogItem extends CatalogSeed {
  id: string
  /** Real photos (public URLs, in display order). Demo items have none and show
   *  generated tiles instead, so `photos` stays the count either way. */
  photoUrls?: string[]
}

export interface Message {
  id: string
  from: "customer" | "agent" | "human"
  text: string
  at: string
  attachmentItemId?: string
}

export interface Appointment {
  id: string
  contactId: string
  at: string
  label: string
  status: "confirmed" | "pending"
}

export interface TimelineEvent {
  id: string
  at: string
  text: string
  kind: "lead" | "agent" | "stage" | "media" | "appointment" | "money"
}

export interface Contact {
  id: string
  name: string
  phone: string
  email: string
  channel: Channel
  temperature: Temperature
  stageId: string
  /** Money the deal is worth; counted as revenue only when it reached the last stage. */
  value: number
  itemId: string
  createdAt: string
  lastContactAt: string
  closedAt?: string
  handledBy: "agent" | "human"
  unread: number
  tags: string[]
  fields: Record<string, string>
  summary: string
  messages: Message[]
  timeline: TimelineEvent[]
  /** Seconds the agent took to answer the first message. */
  firstReplySeconds: number
  /** Voice only: call length in seconds. */
  callSeconds?: number
}

export interface CrmData {
  tenant: Tenant
  pack: IndustryPack
  now: string
  /** Where this workspace lives in the URL: `/crm/<slug>` (demo) or `/app/<slug>`. */
  basePath: string
  /** Demo workspaces are generated and read-only; real ones come from the database. */
  demo: boolean
  contacts: Contact[]
  appointments: Appointment[]
  catalog: CatalogItem[]
  /** What the agents are told about the business. Real workspaces only. */
  profile?: BusinessProfile
}
