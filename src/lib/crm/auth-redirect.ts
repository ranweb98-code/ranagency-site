/** `next` comes from the URL, so it is only ever followed inside /app. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/app") || raw.startsWith("//") || raw.includes("\\")) return "/app"
  return raw
}
