// A small fixed-window limiter for the public chat endpoint. It lives in the
// memory of one server instance, so it is a speed bump (it stops a loop or a
// curious visitor from burning the free quota), not a guarantee: on serverless
// each instance counts for itself. The model's own quota is the hard ceiling.

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()
const MAX_BUCKETS = 5_000

export function hit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterSeconds: number } {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k)
    if (buckets.size > MAX_BUCKETS) buckets.clear()
  }

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  current.count += 1
  return { ok: current.count <= limit, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }
}
