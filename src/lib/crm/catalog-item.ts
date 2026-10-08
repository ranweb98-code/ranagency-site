// What an owner types into the catalog form. Pure, so the server action and the
// form agree on the same limits.

export const CATALOG_LIMITS = { title: 60, subtitle: 120, suffix: 24, tag: 24, tags: 5, photos: 12, items: 200, price: 10_000_000 } as const

export const ITEM_STATUSES = ["available", "hot", "reserved", "sold"] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export interface CatalogItemValue {
  title: string
  subtitle: string | null
  price: number
  priceSuffix: string | null
  tags: string[]
  status: ItemStatus
}

const clean = (value: unknown): string => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "")

export function validateCatalogItem(input: unknown): { ok: true; value: CatalogItemValue } | { ok: false; error: string } {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {}

  const title = clean(raw.title)
  if (!title) return { ok: false, error: "כתבו שם" }
  if (title.length > CATALOG_LIMITS.title) return { ok: false, error: `השם ארוך מדי (עד ${CATALOG_LIMITS.title} תווים)` }

  const subtitle = clean(raw.subtitle)
  if (subtitle.length > CATALOG_LIMITS.subtitle) return { ok: false, error: `התיאור ארוך מדי (עד ${CATALOG_LIMITS.subtitle} תווים)` }

  // Prices are whole shekels; an empty field means "no fixed price yet".
  const priceText = clean(raw.price).replace(/[,\s₪]/g, "")
  if (priceText && !/^\d+$/.test(priceText)) return { ok: false, error: "המחיר צריך להיות מספר, בשקלים" }
  const price = priceText ? Number(priceText) : 0
  if (price > CATALOG_LIMITS.price) return { ok: false, error: "המחיר גבוה מדי" }

  const suffix = clean(raw.priceSuffix)
  if (suffix.length > CATALOG_LIMITS.suffix) return { ok: false, error: `הערה למחיר ארוכה מדי (עד ${CATALOG_LIMITS.suffix} תווים)` }

  const tags = [
    ...new Set(
      clean(raw.tags)
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ]
  if (tags.length > CATALOG_LIMITS.tags) return { ok: false, error: `עד ${CATALOG_LIMITS.tags} קטגוריות` }
  if (tags.some((t) => t.length > CATALOG_LIMITS.tag)) return { ok: false, error: `קטגוריה ארוכה מדי (עד ${CATALOG_LIMITS.tag} תווים)` }

  const status = ITEM_STATUSES.find((s) => s === raw.status) ?? "available"

  return { ok: true, value: { title, subtitle: subtitle || null, price, priceSuffix: suffix || null, tags, status } }
}
