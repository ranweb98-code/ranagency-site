import type { CrmData } from "./types"

// What the bell shows. A notification is news for the people who run the
// business: a new lead, a booked appointment, or "the agent needs you".

export type NotificationKind = "lead_new" | "appointment" | "needs_human" | "info"

export const NOTIFICATION_KINDS: readonly NotificationKind[] = ["lead_new", "appointment", "needs_human", "info"]

export interface Notice {
  id: string
  kind: NotificationKind
  /** "The agent is stuck" is urgent; everything else is news. */
  urgent: boolean
  title: string
  body: string
  contactId?: string
  at: string
}

export interface NotificationFeed {
  items: Notice[]
  /** Everything newer than this is unread; `null` means nothing was ever seen. */
  seenAt: string | null
}

export function unreadCount(feed: NotificationFeed, seenAt: string | null = feed.seenAt): number {
  const seen = seenAt ? Date.parse(seenAt) : 0
  return feed.items.filter((n) => Date.parse(n.at) > seen).length
}

/** Where tapping a notification goes: the conversation it is about, or the
 *  overview when it is about the business as a whole. */
export function noticeHref(base: string, notice: Notice): string {
  return notice.contactId ? `${base}/inbox?c=${notice.contactId}` : base
}

/** Believable notifications for the demo, built from the demo's own people so
 *  they match what the rest of the screen shows. */
export function demoNotifications(data: CrmData): NotificationFeed {
  const recent = [...data.contacts].sort((a, b) => Date.parse(b.lastContactAt) - Date.parse(a.lastContactAt))
  const items: Notice[] = []

  const stuck = recent.find((c) => c.handledBy === "human") ?? recent[1]
  if (stuck) {
    const last = [...stuck.messages].reverse().find((m) => m.from === "customer")
    items.push({
      id: "demo-stuck",
      kind: "needs_human",
      urgent: true,
      title: `${stuck.name} מחכה לתשובה שלכם`,
      body: last ? `הלקוח כתב: “${last.text}”. הסוכן העביר אליכם את השיחה.` : "הסוכן העביר אליכם את השיחה וממתין שתענו.",
      contactId: stuck.id,
      at: stuck.lastContactAt,
    })
  }

  const hot = recent.find((c) => c.temperature === "hot" && c.id !== stuck?.id)
  if (hot) {
    items.push({ id: "demo-hot", kind: "lead_new", urgent: false, title: `ליד חם חדש: ${hot.name}`, body: hot.summary, contactId: hot.id, at: hot.createdAt })
  }

  const booked = data.appointments[0]
  const bookedContact = booked ? data.contacts.find((c) => c.id === booked.contactId) : undefined
  if (booked && bookedContact) {
    items.push({ id: "demo-appointment", kind: "appointment", urgent: false, title: `תור חדש: ${bookedContact.name}`, body: booked.label, contactId: bookedContact.id, at: bookedContact.lastContactAt })
  }

  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return { items, seenAt: null }
}
