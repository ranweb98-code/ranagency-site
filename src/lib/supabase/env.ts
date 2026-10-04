// Both values are public by design (the publishable key is what ships to every
// browser; row level security is what protects the data), so they live in
// NEXT_PUBLIC_* and in the repo's docs. The service-role key is never used.

export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && key ? { url, key } : null
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null
}
