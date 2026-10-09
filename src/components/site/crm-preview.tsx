"use client"

import {
  BarChart3,
  Bell,
  Bot,
  CalendarCheck,
  CalendarDays,
  Flame,
  Mail,
  MessageCircle,
  Plus,
  Search,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react"
import Link from "next/link"
import { memo, useEffect, useRef, useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { ChannelDot, CHANNELS } from "@/components/crm/ui/channel"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Ltr } from "@/components/crm/ui/ltr"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { CalendarCard } from "@/components/crm/overview/calendar-card"
import { DealCards } from "@/components/crm/overview/deal-cards"
import { FunnelCard } from "@/components/crm/overview/funnel-card"
import { DetailsCard, ProfileCard } from "@/components/crm/overview/profile-panel"
import { formatMoneyCompact } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"
import { themeStyle } from "@/lib/crm/theme"
import type { Contact, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

export interface CrmPreviewStats {
  closed30: number
  closedCount30: number
  closedDelta: number | null
  newLeads7: number
  newLeadsToday: number
  upcoming7: number
  upcomingToday: number
}

interface NavTab {
  key: string
  href: string
  label: string
  badge?: number
}

// Neither card reads the selected customer, so the new-lead loop (a re-render
// every few seconds) has no reason to rebuild a 31-day calendar and a funnel.
const StaticCalendarCard = memo(CalendarCard)
const StaticFunnelCard = memo(FunnelCard)

/** How long a new-lead notice stays up, and how often the next one arrives. */
const TOAST_MS = 3600
const CYCLE_MS = 5200
/** After the visitor touches the preview, leave their choice alone this long. */
const HANDS_OFF_MS = 14_000

/**
 * The marketing site's window onto the real product.
 *
 * Everything inside is the CRM's own overview — the same deal cards, profile
 * card, calendar and funnel components the signed-in screen renders, fed the
 * same kind of demo data, wearing the same brand variables — so what a visitor
 * sees here is what they get, not a drawing of it. Only the chrome (top bar and
 * dock) is rebuilt: in the app those are `position: fixed` and tied to the
 * router, neither of which belongs inside a box on a landing page.
 *
 * While it is on screen a new customer message arrives every few seconds: a
 * notice slides up, the deal card for that customer lights, and the profile
 * beside it swaps — the loop the product actually runs, shown on a loop.
 */
export function CrmPreview({
  data,
  deals,
  metrics,
  stats,
  unread,
}: {
  data: CrmData
  deals: Contact[]
  metrics: Metrics
  stats: CrmPreviewStats
  unread: number
}) {
  const base = data.basePath
  const { vocab } = data.pack
  const itemById = new Map(data.catalog.map((c) => [c.id, c]))

  const frameRef = useRef<HTMLDivElement>(null)
  const inView = useInView(frameRef, { amount: 0.35 })
  const prefersReducedMotion = useReducedMotion()

  const [selectedId, setSelectedId] = useState(deals[0].id)
  const [noticeId, setNoticeId] = useState<string | null>(null)
  const cursor = useRef(0)
  const handsOffUntil = useRef(0)

  const selected = deals.find((d) => d.id === selectedId) ?? deals[0]
  const notice = deals.find((d) => d.id === noticeId)

  useEffect(() => {
    if (!inView || prefersReducedMotion) return

    const timers: number[] = []
    const arrive = () => {
      // The visitor is poking at it: no new "arrivals" while they read.
      if (Date.now() < handsOffUntil.current) return
      cursor.current = (cursor.current + 1) % deals.length
      const next = deals[cursor.current]
      setSelectedId(next.id)
      setNoticeId(next.id)
      timers.push(window.setTimeout(() => setNoticeId(null), TOAST_MS))
    }

    timers.push(window.setTimeout(arrive, 1400))
    const interval = window.setInterval(arrive, CYCLE_MS)
    return () => {
      window.clearInterval(interval)
      timers.forEach(window.clearTimeout)
    }
  }, [inView, prefersReducedMotion, deals])

  const pick = (id: string) => {
    handsOffUntil.current = Date.now() + HANDS_OFF_MS
    cursor.current = Math.max(0, deals.findIndex((d) => d.id === id))
    setNoticeId(null)
    setSelectedId(id)
  }

  const nav: NavTab[] = [
    { key: "overview", href: base, label: "סקירה" },
    { key: "inbox", href: `${base}/inbox`, label: "שיחות", badge: unread },
    { key: "pipeline", href: `${base}/pipeline`, label: "צינור" },
    { key: "calendar", href: `${base}/calendar`, label: "יומן" },
    { key: "contacts", href: `${base}/contacts`, label: vocab.people },
    { key: "catalog", href: `${base}/catalog`, label: vocab.catalog },
    { key: "agents", href: `${base}/agents`, label: "סוכנים" },
  ]

  const delta = stats.closedDelta

  return (
    // No entrance animation on the window itself. Animating a transform on a
    // 1100×860 subtree of glass, gradients and shadows promotes it to one big
    // layer that has to be rasterised in a single go the moment it first
    // scrolls in. As ordinary page content it is rastered in tiles ahead of the
    // viewport instead; the section heading above it already carries the reveal.
    <div>
      <div
        ref={frameRef}
        role="region"
        aria-label="תצוגה חיה של מערכת ה-CRM, עם נתוני הדגמה"
        onPointerEnter={() => {
          handsOffUntil.current = Date.now() + HANDS_OFF_MS / 2
        }}
        className="crm-embed relative h-[680px] rounded-[30px] shadow-[0_28px_56px_-28px_rgba(17,17,17,0.4)] ring-1 ring-black/10 md:h-[860px] md:rounded-[40px]"
        style={themeStyle(data.pack.brand)}
      >
        <div className="relative z-10">
          {/* ── top bar ─────────────────────────────────────────────── */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr] md:ps-[88px] md:py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-crm-ink text-base font-semibold text-white">
                {data.tenant.businessName.replace(/[^\p{L}]/gu, "").slice(0, 1)}
              </span>
              <span className="truncate text-lg font-medium tracking-tight">{data.tenant.businessName}</span>
            </div>

            <nav aria-label="ניווט בהדגמה" className="hidden md:block">
              <ul className="crm-glass flex items-center gap-0.5 rounded-full p-1">
                {nav.map((item, i) => (
                  <li key={item.key} className="relative">
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={i === 0 ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-200",
                        i === 0 ? "bg-crm-ink text-white" : "text-crm-ink/75 hover:text-crm-ink",
                      )}
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="grid min-w-4 place-items-center rounded-full bg-crm-accent px-1 text-[10px] leading-4 text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center justify-end gap-2">
              <Pill tone="white" className="hidden px-3 py-1 text-[11px] lg:inline-flex">
                הדגמה · {data.pack.label}
              </Pill>
              <IconButton label="הודעות" tone="white" tabIndex={-1} className="pointer-events-none hidden sm:inline-grid">
                <Mail />
                <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-crm-accent ring-2 ring-white" />
              </IconButton>
              <IconButton label="התראות" tone="white" tabIndex={-1} className="pointer-events-none">
                <Bell />
                <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-[#ff4d2e] ring-2 ring-white" />
                {notice ? <span className="absolute end-2.5 top-2.5 size-2 animate-ping rounded-full bg-[#ff4d2e]" /> : null}
              </IconButton>
              <Avatar name={data.tenant.ownerName} size="md" className="ring-2 ring-white/90" />
            </div>
          </header>

          {/* ── page header ─────────────────────────────────────────── */}
          <div className="px-4 pb-5 pt-1 sm:px-5 md:ps-[88px] md:pb-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
              <div>
                <p className="mb-1.5 text-xs text-crm-muted">
                  {data.tenant.businessName} · {data.pack.label}
                </p>
                <p className="text-[34px] font-medium leading-[1.05] tracking-tight md:text-[44px]">סקירה</p>
              </div>
              <div className="crm-hide-scrollbar -mx-3 flex gap-6 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 md:gap-8 md:pb-0">
                <StatTile
                  icon={BarChart3}
                  value={<CountUp to={stats.closed30} format={formatMoneyCompact} />}
                  label={`${vocab.revenue}\n${stats.closedCount30} עסקאות ב־30 יום`}
                  badge={delta === null ? undefined : <><Ltr>{delta > 0 ? "+" : ""}{delta}%</Ltr> חודש</>}
                />
                <StatTile
                  icon={UserPlus}
                  value={<Ltr>+<CountUp to={stats.newLeads7} /></Ltr>}
                  label={"פניות חדשות\nב־7 ימים אחרונים"}
                  badge={<><Ltr>+{stats.newLeadsToday}</Ltr> היום</>}
                  badgeTone="accent"
                />
                <StatTile
                  icon={CalendarCheck}
                  value={<CountUp to={stats.upcoming7} />}
                  label={`${vocab.bookings} קרובים\nב־7 ימים`}
                  badge={`${stats.upcomingToday} היום`}
                  badgeTone="soft"
                />
              </div>
            </div>
          </div>

          {/* ── the real overview, as the app lays it out ───────────── */}
          <div className="grid grid-cols-1 gap-3 px-4 sm:px-5 md:ps-[88px] md:gap-4 lg:grid-cols-12">
            <div className="contents lg:col-span-8 lg:grid lg:grid-cols-2 lg:content-start lg:gap-4">
              <SectionCard
                title={vocab.dealsTitle}
                className="order-1 lg:order-none lg:col-span-2"
                menu={[
                  { label: `כל ה${vocab.people}`, href: `${base}/contacts` },
                  { label: "צינור המכירות", href: `${base}/pipeline` },
                  { label: "היומן", href: `${base}/calendar` },
                ]}
              >
                <DealCards deals={deals} catalog={data.catalog} stages={data.pack.stages} detailBase={`${base}/contacts`} selectedId={selected.id} onSelect={pick} />
              </SectionCard>
              <StaticCalendarCard className="order-4 lg:order-none" appointments={data.appointments} contacts={data.contacts} now={data.now} base={base} title={vocab.upcoming} />
              <StaticFunnelCard className="order-5 lg:order-none" metrics={metrics} base={base} peopleLabel={vocab.people} />
            </div>

            <div className="contents lg:col-span-4 lg:grid lg:content-start lg:gap-4">
              {/* Remounted per customer: the CSS entrance plays on each swap. */}
              <div key={`profile-${selected.id}`} className="crm-swap-in order-2 lg:order-none">
                <ProfileCard contact={selected} data={data} base={base} />
              </div>
              <div key={`details-${selected.id}`} className="crm-swap-in order-3 lg:order-none">
                <DetailsCard contact={selected} data={data} base={base} />
              </div>
            </div>
          </div>
        </div>

        {/* ── desktop dock (decorative here: the app's is fixed to the screen) ─ */}
        <div aria-hidden className="crm-dock absolute start-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full px-1.5 py-3 text-white md:flex">
          <DockIcon icon={Search} />
          <DockIcon icon={Plus} />
          <DockIcon icon={Flame} />
          <DockIcon icon={CalendarDays} />
          <DockIcon icon={Bot} />
          <DockIcon icon={MessageCircle} dot ping={Boolean(notice)} />
        </div>

        {/* ── the frame ends in a fade, so the app reads as continuing ────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44"
          style={{ background: "linear-gradient(to top, var(--crm-bg-to) 8%, transparent)" }}
        />

        {/* ── a customer writes in ────────────────────────────────────────── */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <AnimatePresence>
            {notice ? (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
                className="flex max-w-full items-center gap-3 rounded-full bg-white py-2 pe-5 ps-2 shadow-[0_24px_50px_-18px_rgba(17,17,17,0.5)] ring-1 ring-black/[0.06]"
              >
                <ChannelDot channel={notice.channel} className="size-9 [&_svg]:size-4" />
                <div className="min-w-0 text-start">
                  <p className="text-[11px] text-crm-muted">פנייה חדשה ב{CHANNELS[notice.channel].label}</p>
                  <p className="truncate text-[13px] font-medium">
                    {notice.name} · {itemById.get(notice.itemId)?.title ?? notice.summary}
                  </p>
                </div>
                <Pill tone="warm" className="hidden sm:inline-flex">ליד חם</Pill>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DockIcon({ icon: Icon, dot, ping }: { icon: LucideIcon; dot?: boolean; ping?: boolean }) {
  return (
    <span className="relative grid size-10 place-items-center rounded-full text-white/75 [&_svg]:size-[18px]">
      <Icon />
      {dot ? <span className="absolute end-2 top-2 size-2 rounded-full bg-[#ff4d2e]" /> : null}
      {ping ? <span className="absolute end-2 top-2 size-2 animate-ping rounded-full bg-[#ff4d2e]" /> : null}
    </span>
  )
}

/** Counts up to its figure the first time it is on screen. Server HTML carries
 *  the final number, so it is right without JavaScript and while off-screen;
 *  the text is driven directly rather than through state, so a count costs no
 *  re-renders. */
function CountUp({ to, format = String }: { to: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!inView || prefersReducedMotion || !el) return
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        el.textContent = format(Math.round(value))
      },
    })
    return () => controls.stop()
  }, [inView, prefersReducedMotion, to, format])

  return <span ref={ref}>{format(to)}</span>
}

