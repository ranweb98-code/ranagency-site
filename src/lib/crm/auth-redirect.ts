/** `next` comes from the URL, so it is only ever followed inside /app, or to the
 *  owner's contract screen. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || raw.startsWith("//") || raw.includes("\\")) return "/app"
  if (raw === "/admin/contracts") return raw
  return raw.startsWith("/app") ? raw : "/app"
}
