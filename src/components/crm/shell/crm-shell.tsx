"use client"

import {
  Bell,
  Bot,
  CalendarDays,
  Flame,
  Images,
  Kanban,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Pill } from "@/components/crm/ui/pill"
import { cn } from "@/lib/utils"
import { CommandPalette } from "./command-palette"
import { NewLeadDialog } from "./new-lead-dialog"
import { ToastProvider } from "./toast"
import { MoreSheet } from "./more-sheet"

export interface ShellProps {
  slug: string
  businessName: string
  ownerName: string
  industryLabel: string
  peopleLabel: string
  catalogLabel: string
  itemOptions: { id: string; title: string }[]
  unread: number
  search: { id: string; name: string; phone: string }[]
  children: ReactNode
}

interface NavItem {
  key: string
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function CrmShell({ children, slug, businessName, ownerName, industryLabel, peopleLabel, catalogLabel, itemOptions, unread, search }: ShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/crm/${slug}`

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const nav: NavItem[] = [
    { key: "overview", href: base, label: "סקירה", icon: LayoutDashboard },
    { key: "inbox", href: `${base}/inbox`, label: "שיחות", icon: MessageCircle, badge: unread },
    { key: "pipeline", href: `${base}/pipeline`, label: "צינור", icon: Kanban },
    { key: "calendar", href: `${base}/calendar`, label: "יומן", icon: CalendarDays },
    { key: "contacts", href: `${base}/contacts`, label: peopleLabel, icon: Users },
    { key: "catalog", href: `${base}/catalog`, label: catalogLabel, icon: Images },
    { key: "agents", href: `${base}/agents`, label: "סוכנים", icon: Bot },
  ]

  const isActive = (item: NavItem) =>
    item.key === "overview" ? pathname === base : pathname === item.href || pathname.startsWith(`${item.href}/`)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // The bar is transparent at the top of a page (airy, like the reference) and
  // turns into frosted glass once content starts to slide under it — without
  // that, scrolled titles and cards show straight through the logo and the
  // buttons and the words pile up.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const mobilePrimary = nav.filter((n) => ["overview", "inbox", "pipeline", "calendar"].includes(n.key))
  const moreActive = !mobilePrimary.some(isActive)

  return (
    <ToastProvider>
      <div className="relative z-10">
        {/* ── top bar ─────────────────────────────────────────────── */}
        <header
          className={cn(
            "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
            scrolled ? "border-white/70 bg-white/80 backdrop-blur-lg" : "border-transparent",
          )}
        >
          <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-3 py-3 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr] md:ps-[88px] md:py-4">
          <Link href={base} className="flex min-w-0 items-center gap-2.5" aria-label={`${businessName} — סקירה`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-crm-ink text-base font-semibold text-white">
              {businessName.replace(/[^\p{L}]/gu, "").slice(0, 1)}
            </span>
            <span className="truncate text-lg font-medium tracking-tight">{businessName}</span>
          </Link>

          <nav aria-label="ניווט ראשי" className="hidden md:block">
            <ul className="crm-glass flex items-center gap-0.5 rounded-full p-1 backdrop-blur-xl">
              {nav.map((item) => {
                const active = isActive(item)
                return (
                  <li key={item.key} className="relative">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-200",
                        active ? "text-white" : "text-crm-ink/75 hover:text-crm-ink",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="crm-nav-active"
                          className="absolute inset-0 rounded-full bg-crm-ink"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      ) : null}
                      <span className="relative">{item.label}</span>
                      {item.badge ? (
                        <span className="relative grid min-w-4 place-items-center rounded-full bg-crm-accent px-1 text-[10px] leading-4 text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-2">
            <Link href="/crm" className="hidden lg:block" aria-label="חזרה לבחירת עסק לדוגמה">
              <Pill tone="white" className="px-3 py-1 text-[11px]">
                הדגמה · {industryLabel}
              </Pill>
            </Link>
            <IconButton label="חיפוש" tone="white" onClick={() => setPaletteOpen(true)} className="md:hidden">
              <Search />
            </IconButton>
            <IconButton label="הודעות" tone="white" className="hidden sm:inline-grid" onClick={() => router.push(`${base}/inbox`)}>
              <Mail />
              {unread ? <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-crm-accent ring-2 ring-white" /> : null}
            </IconButton>
            <IconButton label="התראות" tone="white" onClick={() => router.push(`${base}/inbox`)}>
              <Bell />
              {unread ? <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-[#ff4d2e] ring-2 ring-white" /> : null}
            </IconButton>
            <Avatar name={ownerName} size="md" className="ring-2 ring-white/90" />
          </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1480px] px-3 pb-28 sm:px-5 md:pb-10 md:ps-[88px]">{children}</div>
      </div>

      {/* ── desktop dock ────────────────────────────────────────── */}
      <aside
        aria-label="פעולות מהירות"
        className="crm-dock fixed start-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full px-1.5 py-3 text-white md:flex"
      >
        <DockButton label="חיפוש (⌘K)" onClick={() => setPaletteOpen(true)}>
          <Search />
        </DockButton>
        <DockButton label="הוספת ליד" onClick={() => setLeadOpen(true)}>
          <Plus />
        </DockButton>
        <DockButton label="לידים חמים" onClick={() => router.push(`${base}/contacts?temp=hot`)}>
          <Flame />
        </DockButton>
        <DockButton label="יומן" onClick={() => router.push(`${base}/calendar`)}>
          <CalendarDays />
        </DockButton>
        <DockButton label="הסוכנים" onClick={() => router.push(`${base}/agents`)}>
          <Bot />
        </DockButton>
        <DockButton label="שיחות" onClick={() => router.push(`${base}/inbox`)}>
          <MessageCircle />
          {unread ? <span className="absolute end-2 top-2 size-2 rounded-full bg-[#ff4d2e]" /> : null}
        </DockButton>
      </aside>

      {/* ── mobile dock ─────────────────────────────────────────── */}
      <nav
        aria-label="ניווט תחתון"
        className="crm-dock fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center justify-between rounded-full px-2 py-2 md:hidden"
      >
        {mobilePrimary.map((item) => (
          <MobileTab key={item.key} item={item} active={isActive(item)} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="עוד"
          className={cn(
            "relative grid size-12 place-items-center rounded-full text-white/70 transition-colors",
            moreActive && "bg-white/12 text-white",
          )}
        >
          <Users className="size-5" aria-hidden />
        </button>
      </nav>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        base={base}
        nav={nav}
        people={search}
        onNewLead={() => {
          setPaletteOpen(false)
          setLeadOpen(true)
        }}
      />
      <NewLeadDialog open={leadOpen} onClose={() => setLeadOpen(false)} personLabel={peopleLabel} items={itemOptions} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} nav={nav.filter((n) => !mobilePrimary.includes(n))} onAdd={() => { setMoreOpen(false); setLeadOpen(true) }} />
    </ToastProvider>
  )
}

function DockButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="relative grid size-10 place-items-center rounded-full text-white/75 transition-colors duration-200 hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-[18px]"
    >
      {children}
    </button>
  )
}

function MobileTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className="relative grid size-12 place-items-center rounded-full text-white/70"
    >
      {active ? (
        <motion.span layoutId="crm-mobile-active" className="absolute inset-0 rounded-full bg-white/14" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
      ) : null}
      <Icon className={cn("relative size-5", active && "text-white")} aria-hidden />
      {item.badge ? <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-[#ff4d2e]" /> : null}
    </Link>
  )
}
