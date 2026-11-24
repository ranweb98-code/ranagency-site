"use client"

import { Bot, Phone, RotateCcw, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Pill } from "@/components/crm/ui/pill"
import { allocate, isTableFree, tableStateAt } from "@/lib/restaurant/allocate"
import {
  DINING_MINUTES,
  FLOORS,
  LANDMARKS,
  NOW,
  SEED_FEED,
  SEED_RESERVATIONS,
  SEED_WAITLIST,
  SOURCE_LABEL,
  TABLES,
  floorLabel,
  formatTime,
  totalSeats,
  type FloorId,
  type Reservation,
  type Source,
  type WaitingParty,
} from "@/lib/restaurant/floor-plan"
import { cn } from "@/lib/utils"

type Line = { who: "caller" | "agent" | "tool"; text: string }
type Step = { line: Line; effect?: () => void }
type ScenarioId = "book" | "now" | "group" | "info"

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "book", label: "הזמנה ל-5 ב-21:00" },
  { id: "now", label: "זוג שמגיע עכשיו" },
  { id: "group", label: "קבוצה של 8" },
  { id: "info", label: "שעות ותפריט" },
]

const STATE_STYLE = {
  free: "bg-white/85 text-crm-ink ring-2 ring-emerald-500/60",
  reserved: "bg-crm-warm text-crm-ink ring-2 ring-amber-600/40",
  seated: "bg-crm-accent text-white ring-2 ring-white/60",
} as const

interface FeedItem {
  id: string
  at: number
  text: string
  source: Source
}

export function RestaurantDemo() {
  const [reservations, setReservations] = useState<Reservation[]>(SEED_RESERVATIONS)
  const [waitlist, setWaitlist] = useState<WaitingParty[]>(SEED_WAITLIST)
  const [feed, setFeed] = useState<FeedItem[]>(SEED_FEED)
  const [floor, setFloor] = useState<FloorId>("hall")
  const [minute, setMinute] = useState(NOW)
  const [selected, setSelected] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const seatsTotal = totalSeats()
  const freeSeats = TABLES.filter((tb) => tableStateAt(tb.id, reservations, minute).state === "free" && isTableFree(tb.id, reservations, minute)).reduce(
    (sum, tb) => sum + tb.seats,
    0,
  )
  const floorSeats = (id: FloorId) =>
    TABLES.filter((tb) => tb.floor === id && isTableFree(tb.id, reservations, minute)).reduce((sum, tb) => sum + tb.seats, 0)

  const selectedTable = TABLES.find((tb) => tb.id === selected)
  const selectedRes = selectedTable ? reservations.filter((r) => r.tableId === selectedTable.id).sort((a, b) => a.start - b.start) : []

  function reset() {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setReservations(SEED_RESERVATIONS)
    setWaitlist(SEED_WAITLIST)
    setFeed(SEED_FEED)
    setLines([])
    setRunning(false)
    setMinute(NOW)
    setSelected(null)
    setFlash(null)
  }

  function buildSteps(id: ScenarioId): Step[] {
    const say = (who: Line["who"], text: string): Step => ({ line: { who, text } })
    if (id === "info") {
      return [
        say("caller", "היי, עד מתי אתם פתוחים היום? ומה יש לכם בתפריט, אפשר בלי גלוטן?"),
        say("agent", "שלום, הגעתם לשיפודי הגפן. היום פתוחים עד 23:30."),
        say("tool", "get_menu(filter=ללא גלוטן)"),
        say("agent", "שיפודי עוף, כבש ואנטריקוט על המנגל מוגשים בלי פיתה, ויש סלטים וצ'יפס בלי גלוטן. לשריין לכם מקום?"),
        say("caller", "אולי בהמשך, תודה."),
        say("agent", "בכיף, אני פה גם בלילה."),
      ]
    }
    const cfg =
      id === "book"
        ? { party: 5, start: 21 * 60, floor: "gallery" as FloorId, name: "דנה לוי", ask: "שלום, אפשר שולחן ל-5 אנשים היום ב-21:00? עדיף למעלה." }
        : id === "now"
          ? { party: 2, start: NOW + 10, floor: undefined, name: "מיכאל", ask: "היי, אנחנו שניים, יש מקום עכשיו? מגיעים בעוד עשר דקות." }
          : { party: 8, start: NOW + 15, floor: "hall" as FloorId, name: "רותם", ask: "אנחנו שמונה אנשים, יש מקום בעוד רבע שעה?" }
    const area = cfg.floor ?? "any"
    const result = allocate(TABLES, reservations, { party: cfg.party, start: cfg.start, floor: cfg.floor }, NOW)
    const steps: Step[] = [
      say("caller", cfg.ask),
      say("agent", "שלום, הגעתם לשיפודי הגפן. רגע, בודק מקומות."),
      say("tool", `check_availability(people=${cfg.party}, time=${formatTime(cfg.start)}, area=${area})`),
    ]
    const book = (tableId: string, start: number): Step => ({
      line: { who: "tool", text: `create_reservation(table=${tableId}, people=${cfg.party}, time=${formatTime(start)}, name=${cfg.name})` },
      effect: () => {
        const res: Reservation = { id: `new-${Date.now()}`, tableId, name: cfg.name, party: cfg.party, start, source: "agent", status: "booked" }
        setReservations((prev) => [...prev, res])
        setFeed((prev) => [{ id: res.id, at: NOW, text: `${cfg.name} · ${cfg.party} סועדים · ${formatTime(start)} · ${floorLabel(TABLES.find((x) => x.id === tableId)!.floor)}`, source: "agent" }, ...prev])
        setFloor(TABLES.find((x) => x.id === tableId)!.floor)
        setMinute(start)
        setSelected(tableId)
        setFlash(tableId)
        timers.current.push(window.setTimeout(() => setFlash(null), 4000))
      },
    })
    if (result.kind === "table") {
      steps.push(
        say("agent", `יש מקום. שולחן ${result.table.id} ב${floorLabel(result.table.floor)}, ל-${result.table.seats} מקומות, ב-${formatTime(cfg.start)}. על איזה שם?`),
        say("caller", `${cfg.name}.`),
        book(result.table.id, cfg.start),
        say("agent", "רשמתי. מגיעה אליכם הודעה לנייד. נתראה!"),
      )
    } else if (result.kind === "alternatives") {
      const first = result.options[0]
      steps.push(
        say("agent", `ב-${formatTime(cfg.start)} אין לי מקום ל-${cfg.party}. יש ב-${formatTime(first.start)} ב${floorLabel(first.table.floor)}. מתאים?`),
        say("caller", "כן, מתאים."),
        book(first.table.id, first.start),
        say("agent", `סגרנו ל-${formatTime(first.start)}. נתראה!`),
      )
    } else {
      steps.push(
        say("agent", `כרגע מלא. אפשר לרשום אתכם לרשימת המתנה, בערך ${result.etaMinutes} דקות. מתאים?`),
        say("caller", "כן, תרשמו."),
        {
          line: { who: "tool", text: `add_to_waitlist(people=${cfg.party}, name=${cfg.name})` },
          effect: () => setWaitlist((prev) => [...prev, { id: `w-${Date.now()}`, name: cfg.name, party: cfg.party, since: NOW }]),
        },
        say("agent", "נרשמתם, אשלח הודעה כשהשולחן מתפנה."),
      )
    }
    return steps
  }

  function run(id: ScenarioId) {
    if (running) return
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setLines([])
    setRunning(true)
    const steps = buildSteps(id)
    steps.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLines((prev) => [...prev, step.line])
          step.effect?.()
          if (i === steps.length - 1) setRunning(false)
        }, 900 * (i + 1)),
      )
    })
  }

  const stat = (label: string, value: string, tone?: string) => (
    <div className="crm-glass rounded-[24px] px-4 py-3">
      <p className="text-[11px] text-crm-muted">{label}</p>
      <p className={cn("mt-0.5 text-[26px] font-medium leading-none tracking-tight", tone)}>{value}</p>
    </div>
  )

  return (
    <main id="main-content" className="relative z-10 mx-auto max-w-[1280px] px-3 py-6 sm:px-5 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-xs text-crm-muted">נפוץ&apos; CRM · הדגמה למסעדה · נתונים לדוגמה</p>
          <h1 className="text-[32px] font-medium leading-[1.05] tracking-tight md:text-[44px]">שיפודי הגפן</h1>
          <p className="mt-2 max-w-xl text-[15px] text-crm-ink/65">סוכן קולי שיודע בכל רגע כמה מקומות נשארו, ומזמין לבד. בלי שתי מזכירות על הטלפון.</p>
        </div>
        <button type="button" onClick={reset} className="flex h-10 items-center gap-1.5 rounded-full bg-crm-ink px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-85">
          <RotateCcw className="size-4" aria-hidden />
          איפוס הדמו
        </button>
      </header>

      <section aria-label="מצב המסעדה" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat(`מקומות פנויים ב-${formatTime(minute)}`, `${freeSeats} מתוך ${seatsTotal}`, freeSeats < 20 ? "text-crm-accent" : "text-emerald-700")}
        {stat("הזמנות הערב", String(reservations.length))}
        {stat("נקבעו על ידי הסוכן", String(reservations.filter((r) => r.source === "agent").length))}
        {stat("ממתינים ברשימה", String(waitlist.length))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="crm-glass rounded-[30px] p-4 md:p-5" aria-label="מפת מקומות">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {FLOORS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFloor(f.id)}
                aria-pressed={floor === f.id}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                  floor === f.id ? "bg-crm-ink text-white" : "bg-black/[0.07] text-crm-ink/75 hover:text-crm-ink",
                )}
              >
                {f.label} · {floorSeats(f.id)} פנויים
              </button>
            ))}
          </div>

          <div className="grid aspect-[3/2.1] grid-cols-12 grid-rows-8 gap-1.5 rounded-[22px] bg-white/35 p-2 sm:gap-2 sm:p-3">
            {LANDMARKS[floor].map((lm) => (
              <div
                key={lm.label}
                className="grid place-items-center rounded-xl bg-black/[0.08] text-[10px] font-medium text-crm-ink/55 [writing-mode:horizontal-tb]"
                style={{ gridColumn: `${lm.cell.col} / span ${lm.cell.w}`, gridRow: `${lm.cell.row} / span ${lm.cell.h}` }}
              >
                {lm.label}
              </div>
            ))}
            {TABLES.filter((tb) => tb.floor === floor).map((tb) => {
              const st = tableStateAt(tb.id, reservations, minute)
              const free = st.state === "free" && isTableFree(tb.id, reservations, minute)
              const kind = free ? "free" : st.state === "free" ? "reserved" : st.state
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setSelected(tb.id)}
                  aria-label={`שולחן ${tb.id}, ${tb.seats} מקומות, ${kind === "free" ? "פנוי" : kind === "seated" ? "תפוס" : "שמור"}`}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center overflow-hidden text-[11px] font-medium leading-tight transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink",
                    tb.shape === "round" ? "rounded-full" : "rounded-2xl",
                    STATE_STYLE[kind],
                    selected === tb.id && "outline-2 outline-offset-2 outline-crm-ink",
                    flash === tb.id && "animate-pulse",
                  )}
                  style={{ gridColumn: `${tb.cell.col} / span ${tb.cell.w}`, gridRow: `${tb.cell.row} / span ${tb.cell.h}` }}
                >
                  <span>{tb.id}</span>
                  <span className="flex items-center gap-0.5 text-[10px] opacity-80">
                    <Users className="size-3" aria-hidden />
                    {tb.seats}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <ul className="flex flex-wrap gap-3">
              <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-white ring-2 ring-emerald-500/60" />פנוי</li>
              <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-crm-warm" />שמור</li>
              <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-crm-accent" />תפוס</li>
            </ul>
            <label className="flex items-center gap-2">
              <span className="text-crm-muted">שעה</span>
              <input
                type="range"
                min={17 * 60}
                max={23 * 60 + 30}
                step={15}
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                aria-label="שעה להצגה"
                className="w-36 accent-[var(--crm-accent)] sm:w-48"
              />
              <bdi className="w-11 font-medium tabular-nums">{formatTime(minute)}</bdi>
            </label>
          </div>

          <div className="mt-3 rounded-[20px] bg-white/45 p-3 text-[13px]">
            {selectedTable ? (
              <>
                <p className="font-medium">
                  שולחן {selectedTable.id} · {selectedTable.seats} מקומות · {floorLabel(selectedTable.floor)}
                </p>
                {selectedRes.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {selectedRes.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2">
                        <bdi className="tabular-nums">{formatTime(r.start)}–{formatTime(r.start + DINING_MINUTES)}</bdi>
                        <span>{r.name} · {r.party}</span>
                        <Pill tone={r.source === "agent" ? "accent" : "soft"}>{SOURCE_LABEL[r.source]}</Pill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-crm-muted">פנוי כל הערב.</p>
                )}
              </>
            ) : (
              <p className="text-crm-muted">לחצו על שולחן כדי לראות מי יושב בו ומה שמור לו.</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="crm-glass rounded-[30px] p-4 md:p-5" aria-label="שיחה עם הסוכן">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-crm-ink text-white"><Bot className="size-4" aria-hidden /></span>
              <div>
                <h2 className="text-[15px] font-medium">הדמיית שיחה</h2>
                <p className="text-[11px] text-crm-muted">טקסט בלבד, בלי קול אמיתי. הסוכן בודק את המפה כאן ומזמין בפועל.</p>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={running}
                  onClick={() => run(s.id)}
                  className="flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-white disabled:opacity-50"
                >
                  <Phone className="size-3.5" aria-hidden />
                  {s.label}
                </button>
              ))}
            </div>
            <ol aria-live="polite" className="flex min-h-40 flex-col gap-2 rounded-[20px] bg-white/45 p-3">
              {lines.length === 0 ? <li className="text-[13px] text-crm-muted">בחרו תרחיש כדי להתחיל שיחה.</li> : null}
              {lines.map((l, i) => (
                <li
                  key={i}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
                    l.who === "caller" && "self-start bg-white",
                    l.who === "agent" && "self-end bg-crm-ink text-white",
                    l.who === "tool" && "self-center bg-crm-warm/70 font-mono text-[11px]",
                  )}
                >
                  {l.who === "tool" ? <bdi dir="ltr">{l.text}</bdi> : l.text}
                </li>
              ))}
            </ol>
          </section>

          <section className="crm-glass rounded-[30px] p-4 md:p-5" aria-label="הזמנות ורשימת המתנה">
            <h2 className="mb-2 text-[15px] font-medium">הזמנות אחרונות</h2>
            <ul className="space-y-1.5 text-[13px]">
              {feed.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{f.text}</span>
                  <Pill tone={f.source === "agent" ? "accent" : "soft"}>{SOURCE_LABEL[f.source]}</Pill>
                </li>
              ))}
            </ul>
            <h2 className="mb-2 mt-4 text-[15px] font-medium">רשימת המתנה</h2>
            <ul className="space-y-1.5 text-[13px]">
              {waitlist.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2">
                  <span>{w.name} · {w.party} סועדים</span>
                  <Pill>מחכים {NOW - w.since} דק׳</Pill>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
