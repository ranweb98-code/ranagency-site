// The shape of a chat request, checked before anything is sent to the model.
// Everything here is untrusted input from a public endpoint.

export const CHAT_LIMITS = { messageChars: 500, turns: 12 } as const

export interface ChatTurn {
  role: "user" | "assistant"
  text: string
}

export function parseChatBody(body: unknown): { ok: true; turns: ChatTurn[] } | { ok: false } {
  const raw = typeof body === "object" && body !== null ? (body as { messages?: unknown }).messages : undefined
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false }

  const turns: ChatTurn[] = []
  for (const item of raw.slice(-CHAT_LIMITS.turns)) {
    if (typeof item !== "object" || item === null) return { ok: false }
    const { role, text } = item as { role?: unknown; text?: unknown }
    if ((role !== "user" && role !== "assistant") || typeof text !== "string") return { ok: false }
    const clean = text.trim().slice(0, CHAT_LIMITS.messageChars)
    if (clean) turns.push({ role, text: clean })
  }

  // The model expects the conversation to open with the visitor and to end with
  // their question; the welcome line is shown on screen only and is never sent.
  while (turns.length && turns[0].role !== "user") turns.shift()
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") return { ok: false }
  return { ok: true, turns }
}
