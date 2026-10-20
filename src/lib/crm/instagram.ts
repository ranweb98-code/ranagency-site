/** One canonical spelling per Instagram username, so the same person is
 *  recognised whether the team typed "@Dana.Cohen", pasted a profile link, or
 *  the agent received the handle from Meta. Mirrors Instagram's own rules:
 *  1–30 letters, digits, dots and underscores, never starting or ending with a
 *  dot or holding two in a row. Case never matters, so it is stored lower-case. */
const HANDLE = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$/

/** The username from what a person typed or pasted, or null when it is not one. */
export function normalizeInstagramHandle(raw: string): string | null {
  let value = raw.trim().toLowerCase()
  const link = value.match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|ig\.me\/m?)\/(?:m\/)?([^/?#\s]+)/)
  if (link) value = link[1]
  value = value.replace(/^@+/, "")
  return HANDLE.test(value) ? value : null
}

/** The profile page, for a person who has no phone number to call. */
export function instagramProfileUrl(handle: string): string {
  return `https://instagram.com/${handle}`
}

/** Opens a direct-message conversation with the account. */
export function instagramMessageUrl(handle: string): string {
  return `https://ig.me/m/${handle}`
}

/** How a handle is shown to people: with its @. */
export function instagramLabel(handle: string): string {
  return `@${handle}`
}
