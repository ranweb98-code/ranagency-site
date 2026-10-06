import { supabaseEnv } from "@/lib/supabase/env"

/** A person's photo is a file in their own folder of the public `avatars` bucket. */
export const AVATAR_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,100}$/

export function publicStorageUrl(bucket: "avatars" | "catalog", path: string): string | undefined {
  const env = supabaseEnv()
  if (!env) return undefined
  return `${env.url}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`
}
