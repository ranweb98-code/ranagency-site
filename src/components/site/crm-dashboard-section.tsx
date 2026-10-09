import { ArrowLeft } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { CrmPreview, type CrmPreviewStats } from "@/components/site/crm-preview"
import { SectionContainer } from "@/components/site/section-container"
import { GlowLink } from "@/components/ui/glow-link"
import { dayDiff } from "@/lib/crm/format"
import type { Metrics } from "@/lib/crm/metrics"
import { getCrmWithMetrics } from "@/lib/crm/repository"
import type { Contact, CrmData } from "@/lib/crm/types"

/** The showcase business the preview is built from — the same demo workspace
 *  anyone can open at /crm/chef. */
const DEMO_SLUG = "chef"

/** Appointments further from today than this are never on a screen the preview
 *  can reach (it opens on the current month and the cards shown are recent). */
const APPOINTMENT_WINDOW_DAYS = 45

export async function CrmDashboardSection() {
  const result = await getCrmWithMetrics(DEMO_SLUG)
  if (!result) return null

  const { data, metrics } = result
  const preview = trimForPreview(data, metrics)

  return (
    <section id="dashboard" className="relative overflow-hidden bg-ran-surface-subtle py-24 text-ran-text-on-light">
      <SectionContainer className="relative">
        <Reveal className="mx-auto mb-14 max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">תראו את זה בפעולה</p>
          <h2
            className="font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.025em" }}
          >
            כל ליד, מכל ערוץ, במקום אחד
          </h2>
          <p className="text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6 }}>
            כל שיחה מוואטסאפ, אינסטגרם וטלפון נכנסת אוטומטית לדשבורד אחד — עם סטטוס חם או קר, סיכום
            שיחה ומצב תור, בלי שתצטרכו לעבור בין אפליקציות.
          </p>
        </Reveal>

        <CrmPreview {...preview} />

        <div className="mt-9 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-ran-text-on-light-muted">
            זו המערכת עצמה, עם נתוני הדגמה של עסק לדוגמה. אפשר ללחוץ על הכרטיסים ולהחליף פנייה.
          </p>
          <GlowLink href={data.basePath}>
            לפתיחת ההדגמה המלאה
            <ArrowLeft className="size-4" aria-hidden />
          </GlowLink>
        </div>
      </SectionContainer>
    </section>
  )
}

/**
 * The overview screen takes the whole workspace — every contact with every
 * message and timeline event, plus the full industry pack. A landing page
 * shows six deal cards, one profile and a calendar, so only that goes over the
 * wire: the six deals and the contacts the shown appointments name, with their
 * conversations stripped, the pack without its catalogue seeds and agent
 * briefing, and the metrics without the contact list that `hotOpen` carries.
 */
function trimForPreview(data: CrmData, metrics: Metrics) {
  const { pack } = data
  const stripped = (c: Contact): Contact => ({ ...c, messages: [], timeline: [] })

  // The same rule the app's overview uses for "a deal": past the first
  // conversation, newest first.
  const deals = data.contacts
    .filter((c) => pack.stages.findIndex((s) => s.id === c.stageId) >= pack.bookedFromStage)
    .sort((a, b) => Date.parse(b.closedAt ?? b.lastContactAt) - Date.parse(a.closedAt ?? a.lastContactAt))
    .slice(0, 6)

  const appointments = data.appointments.filter((a) => Math.abs(dayDiff(a.at, data.now)) <= APPOINTMENT_WINDOW_DAYS)

  const needed = new Set([...deals.map((d) => d.id), ...appointments.map((a) => a.contactId)])
  const contacts = data.contacts.filter((c) => needed.has(c.id)).map(stripped)
  const itemIds = new Set(deals.map((d) => d.itemId))

  const trimmed: CrmData = {
    ...data,
    pack: { ...pack, catalog: [], knowledge: [], openers: [], tags: [] },
    contacts,
    appointments,
    catalog: data.catalog.filter((i) => itemIds.has(i.id)),
  }

  const stats: CrmPreviewStats = {
    closed30: metrics.closed30,
    closedCount30: metrics.closedCount30,
    closedDelta: metrics.closedDelta,
    newLeads7: metrics.newLeads7,
    newLeadsToday: metrics.newLeadsToday,
    upcoming7: metrics.upcoming7,
    upcomingToday: metrics.upcomingToday,
  }

  return {
    data: trimmed,
    deals: deals.map(stripped),
    metrics: { ...metrics, hotOpen: [] },
    stats,
    unread: data.contacts.reduce((sum, c) => sum + c.unread, 0),
  }
}
