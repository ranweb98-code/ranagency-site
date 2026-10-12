import "server-only"

import { headers } from "next/headers"

export interface Caller {
  ip: string
  userAgent: string
}

function clean(value: string | null, max: number): string {
  return (value ?? "").replace(/[\u0000-\u001f]/g, "").slice(0, max)
}

/** Behind Vercel the first x-forwarded-for entry is the visitor's address. */
export function callerFrom(h: Headers): Caller {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim()
  return { ip: clean(forwarded || h.get("x-real-ip") || "unknown", 64), userAgent: clean(h.get("user-agent"), 400) }
}

export async function currentCaller(): Promise<Caller> {
  return callerFrom(await headers())
}
