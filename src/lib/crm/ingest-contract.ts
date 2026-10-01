// The one event shape every agent sends to the CRM — WhatsApp, Instagram and
// the voice agent alike. It is defined now, before any agent is wired, so that
// connecting the first client is "point the channel at /api/ingest" and never
// "change the CRM". Nothing consumes this yet; there is no endpoint.
//
// Every request carries the client's secret key (the tenant is resolved from
// it, never from the payload), and is idempotent on `eventId`.

import type { Channel } from "./types"

interface BaseEvent {
  /** Unique per event; a retried delivery with the same id is ignored. */
  eventId: string
  channel: Channel
  /** ISO timestamp from the source system. */
  occurredAt: string
  /** The customer, as the channel knows them. Phone is the merge key. */
  customer: { phone?: string; instagramHandle?: string; name?: string }
}

export interface MessageEvent extends BaseEvent {
  type: "message"
  direction: "inbound" | "outbound"
  /** Who wrote an outbound message. */
  author?: "agent" | "human"
  text: string
  /** Catalog items the agent attached (photos, price card). */
  attachmentItemIds?: string[]
}

export interface CallEvent extends BaseEvent {
  type: "call_ended"
  durationSeconds: number
  transcript: { speaker: "customer" | "agent"; text: string }[]
  recordingUrl?: string
}

export interface LeadQualifiedEvent extends BaseEvent {
  type: "lead_qualified"
  temperature: "hot" | "warm" | "cold"
  /** One-line AI summary shown on the card. */
  summary: string
  interestedItemId?: string
  /** Estimated value from the catalog price — never the confirmed revenue. */
  estimatedValue?: number
  customFields?: Record<string, string>
}

export interface AppointmentEvent extends BaseEvent {
  type: "appointment_booked" | "appointment_changed" | "appointment_cancelled"
  appointmentId: string
  startsAt: string
  label: string
}

export type IngestEvent = MessageEvent | CallEvent | LeadQualifiedEvent | AppointmentEvent
