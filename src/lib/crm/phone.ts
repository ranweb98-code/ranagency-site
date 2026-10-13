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

/** The digits of a number in international form (972501234567), or null when it is not one. */
function internationalDigits(raw: string): string | null {
  const trimmed = raw.trim()
  let digits = trimmed.replace(/\D/g, "")
  if (trimmed.startsWith("00")) digits = digits.slice(2)
  else if (!trimmed.startsWith("+")) {
    if (!digits.startsWith("0")) return null
    digits = `972${digits.slice(1)}`
  }
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

/** A wa.me chat link for a phone number, or null when there is no usable number. */
export function whatsappLink(raw: string): string | null {
  const digits = internationalDigits(raw)
  return digits ? `https://wa.me/${digits}` : null
}

/** A tel: link, or null when there is no usable number. */
export function telLink(raw: string): string | null {
  const digits = internationalDigits(raw)
  return digits ? `tel:+${digits}` : null
}
