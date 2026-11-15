import { createHmac, timingSafeEqual } from "node:crypto"

import { normalizePhone } from "./phone"

// What the CRM needs from a finished phone call, taken out of the voice
// platform's "post call transcription" webhook. The platform's payload has
// grown over time and its field names differ between versions, so every field is
// read defensively from the places it is known to live, and the raw payload is
// stored alongside the lead so nothing is lost if a field moves.

export type Temperature = "hot" | "warm" | "cold"

export interface VoiceTurn {
  author: "customer" | "agent"
  text: string
  /** ISO time of the turn inside the call. */
  at: string
}

export interface VoiceCall {
  /** The platform's conversation id: a retried delivery carries the same one. */
  eventId: string
  startedAt: string
  durationSeconds: number
  /** Canonical spelling (050-123-4567), or null when the caller hid their number. */
  phone: string | null
  /** What the agent heard, "" when the caller never said a name. */
  name: string
  summary: string
  temperature: Temperature
  turns: VoiceTurn[]
}

export type ParsedEvent = { kind: "call"; call: VoiceCall } | { kind: "ignored"; reason: string } | { kind: "invalid"; error: string }

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "")
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)

const MAX_TURNS = 200
const MAX_TEXT = 2000

/** The answer the agent collected for a field ("name", "lead_temperature"…), whatever the id the owner gave it. */
function collected(analysis: Obj, ids: string[]): string {
  const results = analysis.data_collection_results
  if (!isObj(results)) return ""
  for (const id of ids) {
    const entry = results[id]
    const value = isObj(entry) ? entry.value : entry
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

/** "hot" / "warm" / "cold", in English or Hebrew; anything else is a lukewarm default. */
export function parseTemperature(raw: string): Temperature {
  const t = raw.toLowerCase()
  if (/hot|חם|דחוף|מוכן/.test(t)) return "hot"
  if (/cold|קר|לא מעוניין/.test(t)) return "cold"
  return "warm"
}

function callerNumber(data: Obj): string | null {
  const metadata = isObj(data.metadata) ? data.metadata : {}
  const phoneCall = isObj(metadata.phone_call) ? metadata.phone_call : {}
  const init = isObj(data.conversation_initiation_client_data) ? data.conversation_initiation_client_data : {}
  const vars = isObj(init.dynamic_variables) ? init.dynamic_variables : {}
  const direction = str(phoneCall.direction)
  // On an inbound call the other party is the caller; on an outbound one it is whoever the agent dialled.
  const candidates = [phoneCall.external_number, vars.system__caller_id, direction === "outbound" ? undefined : phoneCall.from_number, vars.system__called_number]
  for (const c of candidates) {
    const n = normalizePhone(str(c))
    if (n) return n
  }
  return null
}

/** Reads one webhook body. Only a finished call with a transcript becomes a lead. */
export function parseElevenLabsEvent(body: unknown, now: number = Date.now()): ParsedEvent {
  if (!isObj(body)) return { kind: "invalid", error: "body is not an object" }
  const type = str(body.type)
  if (type !== "post_call_transcription") return { kind: "ignored", reason: type ? `event type ${type}` : "no event type" }

  const data = body.data
  if (!isObj(data)) return { kind: "invalid", error: "no data" }
  const eventId = str(data.conversation_id)
  if (!eventId || eventId.length > 200) return { kind: "invalid", error: "no conversation_id" }

  const metadata = isObj(data.metadata) ? data.metadata : {}
  const analysis = isObj(data.analysis) ? data.analysis : {}

  const startSecs = num(metadata.start_time_unix_secs) ?? num(body.event_timestamp)
  const startMs = Math.min(startSecs !== null ? startSecs * 1000 : now, now)
  const durationSeconds = Math.max(0, Math.round(num(metadata.call_duration_secs) ?? 0))

  const turns: VoiceTurn[] = []
  const transcript = Array.isArray(data.transcript) ? data.transcript : []
  transcript.forEach((raw, index) => {
    if (!isObj(raw) || turns.length >= MAX_TURNS) return
    const text = str(raw.message).slice(0, MAX_TEXT)
    if (!text) return
    const offset = num(raw.time_in_call_secs) ?? index
    turns.push({
      author: str(raw.role) === "user" ? "customer" : "agent",
      text,
      at: new Date(Math.min(startMs + offset * 1000, now)).toISOString(),
    })
  })
  if (turns.length === 0) return { kind: "ignored", reason: "call with no spoken turns" }

  const summary = str(analysis.transcript_summary) || turns.find((t) => t.author === "customer")?.text.slice(0, 200) || ""
  const name = collected(analysis, ["name", "customer_name", "full_name", "caller_name", "שם"]).slice(0, 80)
  const temperature = parseTemperature(collected(analysis, ["lead_temperature", "temperature", "interest_level", "חום"]))

  return {
    kind: "call",
    call: { eventId, startedAt: new Date(startMs).toISOString(), durationSeconds, phone: callerNumber(data), name, summary: summary.slice(0, 600), temperature, turns },
  }
}

/** The `ElevenLabs-Signature` header is `t=<unix seconds>,v0=<hex>`, where the hex is
 *  HMAC-SHA256(secret, "<t>.<raw body>"). The raw body matters: re-serialised JSON
 *  would not match. A signature older than 30 minutes is refused, so a captured
 *  request cannot be replayed later. */
export function verifySignature(header: string | null, rawBody: string, secret: string, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false
  const parts = header.split(",").map((p) => p.trim())
  const t = parts.find((p) => p.startsWith("t="))?.slice(2)
  const signatures = parts.filter((p) => p.startsWith("v0=")).map((p) => p.slice(3))
  const timestamp = Number(t)
  if (!t || !Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 30 * 60) return false

  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"), "utf8")
  return signatures.some((s) => {
    const given = Buffer.from(s, "utf8")
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
