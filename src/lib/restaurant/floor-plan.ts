// Demo restaurant: three areas, 24 tables, one clock. Everything here is plain
// data so the same shapes can later come from a real reservation system.

export type FloorId = "hall" | "gallery" | "terrace"

export interface Floor {
  id: FloorId
  label: string
  note: string
}

/** Position on the floor's 12 × 8 grid (1-based, like CSS grid lines). */
export interface Cell {
  col: number
  row: number
  w: number
  h: number
}

export interface RestaurantTable {
  id: string
  floor: FloorId
  seats: number
  cell: Cell
  shape: "round" | "rect"
}

export type Source = "agent" | "phone" | "walkin" | "web"
export type ReservationStatus = "booked" | "seated"

export interface Reservation {
  id: string
  tableId: string
  name: string
  party: number
  /** Minutes since midnight. */
  start: number
  source: Source
  status: ReservationStatus
}

export interface WaitingParty {
  id: string
  name: string
  party: number
  /** Minutes since midnight when they joined the list. */
  since: number
}

/** How long a party keeps a table. */
export const DINING_MINUTES = 90
/** The demo's "now": Friday evening, 20:10. */
export const NOW = 20 * 60 + 10
export const OPENS = 12 * 60
export const CLOSES = 23 * 60 + 30

export const FLOORS: Floor[] = [
  { id: "hall", label: "קומה 1 · אולם", note: "ליד המנגל" },
  { id: "gallery", label: "קומה 2 · גלריה", note: "שולחן קבוצות" },
  { id: "terrace", label: "מרפסת", note: "אוויר פתוח" },
]

const t = (id: string, floor: FloorId, seats: number, col: number, row: number, w: number, h: number): RestaurantTable => ({
  id,
  floor,
  seats,
  cell: { col, row, w, h },
  shape: seats === 2 ? "round" : "rect",
})

export const TABLES: RestaurantTable[] = [
  // hall
  t("A1", "hall", 2, 1, 1, 2, 2),
  t("A2", "hall", 2, 1, 3, 2, 2),
  t("A3", "hall", 2, 1, 5, 2, 2),
  t("A4", "hall", 4, 4, 1, 3, 2),
  t("A5", "hall", 4, 4, 4, 3, 2),
  t("A6", "hall", 4, 4, 7, 3, 2),
  t("A7", "hall", 6, 8, 1, 3, 2),
  t("A8", "hall", 6, 8, 4, 3, 2),
  t("A9", "hall", 4, 8, 7, 3, 2),
  t("A10", "hall", 2, 1, 7, 2, 2),
  // gallery
  t("B1", "gallery", 10, 1, 1, 6, 2),
  t("B2", "gallery", 4, 8, 1, 3, 2),
  t("B3", "gallery", 4, 1, 4, 3, 2),
  t("B4", "gallery", 4, 5, 4, 3, 2),
  t("B5", "gallery", 2, 8, 4, 2, 2),
  t("B6", "gallery", 6, 1, 7, 4, 2),
  t("B7", "gallery", 6, 6, 7, 4, 2),
  t("B8", "gallery", 2, 10, 4, 2, 2),
  // terrace
  t("C1", "terrace", 2, 1, 1, 2, 2),
  t("C2", "terrace", 2, 4, 1, 2, 2),
  t("C3", "terrace", 4, 7, 1, 3, 2),
  t("C4", "terrace", 4, 1, 4, 3, 2),
  t("C5", "terrace", 4, 5, 4, 3, 2),
  t("C6", "terrace", 6, 1, 7, 4, 2),
]

/** Fixed features drawn on the map so it reads as a room, not a grid. */
export const LANDMARKS: Record<FloorId, { label: string; cell: Cell }[]> = {
  hall: [
    { label: "מנגל", cell: { col: 12, row: 1, w: 1, h: 5 } },
    { label: "כניסה", cell: { col: 11, row: 7, w: 2, h: 2 } },
  ],
  gallery: [{ label: "מדרגות", cell: { col: 11, row: 7, w: 2, h: 2 } }],
  terrace: [{ label: "מעקה", cell: { col: 10, row: 1, w: 3, h: 8 } }],
}

const r = (id: string, tableId: string, name: string, party: number, hhmm: string, source: Source, status: ReservationStatus): Reservation => {
  const [h, m] = hhmm.split(":").map(Number)
  return { id, tableId, name, party, start: h * 60 + m, source, status }
}

/** A busy Friday: who is sitting now and what is booked for the evening. */
export const SEED_RESERVATIONS: Reservation[] = [
  r("r1", "A1", "יעל ברק", 2, "19:00", "phone", "seated"),
  r("r2", "A4", "משפחת כהן", 4, "19:30", "agent", "seated"),
  r("r3", "A7", "רונן לוי", 6, "19:15", "web", "seated"),
  r("r4", "A9", "גיא אשכנזי", 3, "18:55", "walkin", "seated"),
  r("r5", "B1", "חברת סטרטאפ", 10, "19:45", "phone", "seated"),
  r("r6", "B3", "טל מזרחי", 4, "19:30", "agent", "seated"),
  r("r7", "B6", "משפחת אזולאי", 5, "19:20", "phone", "seated"),
  r("r8", "C3", "ליאור שפירא", 4, "19:40", "agent", "seated"),
  r("r9", "C1", "נועה דגן", 2, "19:35", "web", "seated"),
  r("r10", "A2", "עמית רוזן", 2, "20:30", "agent", "booked"),
  r("r11", "A5", "משפחת חדד", 4, "20:45", "phone", "booked"),
  r("r12", "A8", "יום הולדת לנועם", 6, "21:00", "agent", "booked"),
  r("r13", "B2", "אורי פרץ", 4, "20:30", "agent", "booked"),
  r("r14", "B4", "מיכל גולן", 3, "21:00", "web", "booked"),
  r("r15", "B7", "צוות מכירות", 6, "21:15", "phone", "booked"),
  r("r16", "C4", "דור אביב", 4, "21:00", "agent", "booked"),
  r("r17", "A3", "שירן כץ", 2, "21:30", "agent", "booked"),
  r("r18", "A6", "הילה נחום", 4, "21:30", "web", "booked"),
]

export const SEED_WAITLIST: WaitingParty[] = [
  { id: "w1", name: "אבי ושרון", party: 2, since: NOW - 12 },
  { id: "w2", name: "משפחת יוסף", party: 5, since: NOW - 4 },
]

export const SEED_FEED: { id: string; at: number; text: string; source: Source }[] = [
  { id: "f1", at: NOW - 3, text: "דור אביב · 4 סועדים · 21:00 · מרפסת", source: "agent" },
  { id: "f2", at: NOW - 9, text: "שירן כץ · 2 סועדים · 21:30 · אולם", source: "agent" },
  { id: "f3", at: NOW - 21, text: "אורי פרץ · 4 סועדים · 20:30 · גלריה", source: "agent" },
]

export const SOURCE_LABEL: Record<Source, string> = {
  agent: "סוכן קולי",
  phone: "טלפון",
  walkin: "הגעה למקום",
  web: "אתר",
}

export function totalSeats(tables: RestaurantTable[] = TABLES): number {
  return tables.reduce((sum, table) => sum + table.seats, 0)
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function floorLabel(id: FloorId): string {
  return FLOORS.find((f) => f.id === id)?.label ?? id
}
