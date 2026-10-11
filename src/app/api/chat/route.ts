import { SYSTEM_PROMPT } from "@/lib/chat/knowledge"
import { hit } from "@/lib/chat/rate-limit"
import { parseChatBody } from "@/lib/chat/validate"

// The site's chat assistant. The browser sends the visible conversation; this
// adds the instructions and the key (which never leaves the server), asks
// Gemini for a streamed answer, and passes the text through as it arrives.

export const maxDuration = 30

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite"
// The base can be pointed at a stand-in server when testing without a real key.
const BASE = process.env.GEMINI_API_BASE ?? "https://generativelanguage.googleapis.com"
const ENDPOINT = `${BASE}/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`

const PER_MINUTE = 8
const PER_DAY = 80
const ALLOWED_HOSTS = new Set(["napuch.co.il", "www.napuch.co.il", "ranagency.online", "www.ranagency.online", "localhost"])

const fail = (error: "unavailable" | "rate" | "busy" | "bad" | "origin", status: number, headers?: HeadersInit) => Response.json({ error }, { status, headers })

/** Only this site's own pages may call it, so the free quota is not spent by
 *  someone else's page or a script. (Not security: a script can fake the header.
 *  It is what keeps ordinary cross-site use out.) */
function fromOurPages(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false
  try {
    const { hostname } = new URL(origin)
    return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".vercel.app")
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return fail("unavailable", 503)
  if (!fromOurPages(request)) return fail("origin", 403)

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const minute = hit(`m:${ip}`, PER_MINUTE, 60_000)
  const day = hit(`d:${ip}`, PER_DAY, 86_400_000)
  if (!minute.ok || !day.ok) return fail("rate", 429, { "Retry-After": String(Math.max(minute.retryAfterSeconds, day.ok ? 0 : day.retryAfterSeconds)) })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("bad", 400)
  }
  const parsed = parseChatBody(body)
  if (!parsed.ok) return fail("bad", 400)

  let upstream: Response
  try {
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: parsed.turns.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.text }] })),
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 800,
          // 2.5 models "think" before answering by default; for a short, grounded
          // reply that is only latency.
          ...(MODEL.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
      signal: request.signal,
    })
  } catch {
    return fail("busy", 502)
  }
  if (upstream.status === 429) return fail("rate", 429)
  if (!upstream.ok || !upstream.body) {
    // The reason (a bad key, a retired model, a region block) is otherwise invisible: the visitor only sees "busy".
    console.error("chat: model refused", upstream.status, MODEL, (await upstream.text().catch(() => "")).slice(0, 400))
    return fail("busy", 502)
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ""
  let sentText = false

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        // A blocked or empty answer still gets a reply, never a silent bubble.
        if (!sentText) controller.enqueue(encoder.encode("את זה אני לא יכול לענות עליו. אפשר לשאול אותי על השירות של נפוץ', או לדבר איתנו ישירות בוואטסאפ."))
        controller.close()
        return
      }
      // SSE events are separated by a blank line, which Google sends as CRLF CRLF.
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n")
      const events = buffer.split("\n\n")
      buffer = events.pop() ?? ""
      for (const event of events) {
        const line = event.split("\n").find((l) => l.startsWith("data:"))
        if (!line) continue
        try {
          const data = JSON.parse(line.slice(5)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
          const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
          if (text) {
            sentText = true
            controller.enqueue(encoder.encode(text))
          }
        } catch {
          /* a partial or non-JSON line: skip it, the next event carries on */
        }
      }
    },
    cancel() {
      void reader.cancel()
    },
  })

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } })
}
