import {
  CLOSES,
  DINING_MINUTES,
  type FloorId,
  type Reservation,
  type RestaurantTable,
} from "./floor-plan"

export type TableState = "free" | "reserved" | "seated"

/** What is happening at a table at one moment. */
export function tableStateAt(tableId: string, reservations: Reservation[], minute: number): { state: TableState; reservation?: Reservation } {
  const mine = reservations.filter((res) => res.tableId === tableId)
  const current = mine.find((res) => res.start <= minute && minute < res.start + DINING_MINUTES)
  if (current) return { state: current.status === "seated" ? "seated" : "reserved", reservation: current }
  // Booked within the next hour: held, so the map shows what is about to fill.
  const soon = mine.find((res) => res.start > minute && res.start - minute <= 60)
  if (soon) return { state: "reserved", reservation: soon }
  return { state: "free" }
}

/** Does a new party starting at `start` collide with anything on this table? */
export function isTableFree(tableId: string, reservations: Reservation[], start: number): boolean {
  const end = start + DINING_MINUTES
  return !reservations.some((res) => res.tableId === tableId && res.start < end && start < res.start + DINING_MINUTES)
}

export interface AllocateRequest {
  party: number
  start: number
  /** Preferred area; the search widens to the rest only if it is full. */
  floor?: FloorId
}

export type Allocation =
  | { kind: "table"; table: RestaurantTable }
  | { kind: "alternatives"; options: { table: RestaurantTable; start: number }[] }
  | { kind: "waitlist"; etaMinutes: number }

/** The smallest free table that fits, preferring the asked-for area. */
export function bestTable(tables: RestaurantTable[], reservations: Reservation[], req: AllocateRequest): RestaurantTable | null {
  const fits = tables
    .filter((table) => table.seats >= req.party && isTableFree(table.id, reservations, req.start))
    .sort((a, b) => {
      const aArea = req.floor && a.floor === req.floor ? 0 : 1
      const bArea = req.floor && b.floor === req.floor ? 0 : 1
      if (aArea !== bArea) return aArea - bArea
      // fewest wasted seats first, so a 10-top is never spent on a couple
      return a.seats - b.seats || a.id.localeCompare(b.id, "en", { numeric: true })
    })
  return fits[0] ?? null
}

const NEARBY = [-30, 30, -60, 60, 90]

export function allocate(tables: RestaurantTable[], reservations: Reservation[], req: AllocateRequest, now: number): Allocation {
  // bestTable already ranks the asked-for area first, so a table elsewhere
  // only comes back when that area has nothing that fits.
  const exact = bestTable(tables, reservations, req)
  if (exact) return { kind: "table", table: exact }

  const options: { table: RestaurantTable; start: number }[] = []
  for (const delta of NEARBY) {
    const start = req.start + delta
    if (start < now || start + DINING_MINUTES > CLOSES + 30) continue
    const table = bestTable(tables, reservations, { ...req, start })
    if (table) options.push({ table, start })
    if (options.length === 2) break
  }
  if (options.length) return { kind: "alternatives", options }

  // Nothing nearby: scan forward for the first moment a table of that size opens.
  for (let at = now; at <= CLOSES; at += 5) {
    if (bestTable(tables, reservations, { party: req.party, start: at })) return { kind: "waitlist", etaMinutes: Math.max(at - now, 5) }
  }
  return { kind: "waitlist", etaMinutes: 60 }
}
