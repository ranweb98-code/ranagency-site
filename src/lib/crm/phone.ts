/** One canonical spelling per phone number, so the same person is recognised
 *  across channels (the database keeps one contact per business and number).
 *  Israeli numbers become 050-123-4567 / 02-123-4567; anything else keeps its
 *  international form as +<digits>. Returns null when it is not a phone number. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  const plus = trimmed.startsWith("+") || trimmed.startsWith("00")
  let digits = trimmed.replace(/\D/g, "")
  if (trimmed.startsWith("00")) digits = digits.slice(2)

  if (plus && digits.startsWith("972")) digits = `0${digits.slice(3)}`
  else if (plus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null

  if (!digits.startsWith("0")) return null
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  return null
}
