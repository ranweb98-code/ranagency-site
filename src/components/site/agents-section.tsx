import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { AgentFlowDiagram, type FlowNode } from "@/components/site/agent-flow-diagram"
import { SectionContainer } from "@/components/site/section-container"

interface AgentFlow {
  uid: string
  title: string
  subtitle: string
  /** A single accent per agent, loosely echoing each channel's own real-world
   *  colour (WhatsApp green, Instagram magenta, a calm telephony blue) so the
   *  touch of colour reads as intentional rather than an arbitrary gradient. */
  accent: string
  sources: FlowNode[]
  sourceLabel: string
  processorGlyph: FlowNode["glyph"]
  processorLabel: string
  outcomeLabel: string
  bullets: string[]
}

const FLOWS: AgentFlow[] = [
  {
    uid: "wa",
    title: "סוכן וואטסאפ",
    subtitle: "WhatsApp Agent",
    accent: "#16a34a",
    sources: [{ glyph: "message" }, { glyph: "question" }, { glyph: "calendar" }],
    sourceLabel: "פניות נכנסות",
    processorGlyph: "user",
    processorLabel: "הסוכן",
    outcomeLabel: "ליד מסווג",
    bullets: [
      "מענה תוך שניות, בכל שעה",
      "מבין את כוונת הפנייה",
      "מסנן לידים איכותיים",
      "עברית טבעית, לא תשובות רובוטיות",
    ],
  },
  {
    uid: "ig",
    title: "סוכן אינסטגרם",
    subtitle: "Instagram Agent",
    accent: "#c2185b",
    sources: [{ glyph: "camera" }, { glyph: "heart" }, { glyph: "message" }],
    sourceLabel: "הודעות ותגובות",
    processorGlyph: "user",
    processorLabel: "הסוכן",
    outcomeLabel: "פרטים ב-CRM",
    bullets: [
      "עונה לכל הודעה פרטית",
      "אותה אינטליגנציה כמו בוואטסאפ",
      "אוסף פרטי קשר אוטומטית",
      "זמין 24/7, גם בשבת",
    ],
  },
  {
    uid: "voice",
    title: "סוכן קולי",
    subtitle: "Voice Agent",
    accent: "#2563eb",
    sources: [{ glyph: "phone" }, { glyph: "question" }, { glyph: "calendar" }],
    sourceLabel: "שיחות נכנסות",
    processorGlyph: "user",
    processorLabel: "הסוכן",
    outcomeLabel: "תור ביומן",
    bullets: [
      "עונה כמו מזכירה אישית",
      "מבין את המתקשר בזמן אמת",
      "קובע תור תוך כדי השיחה",
      "מסונכרן ליומן שלכם",
    ],
  },
]

export function AgentsSection() {
  return (
    <section id="agents" className="bg-ran-surface-light py-24 md:py-32">
      <SectionContainer>
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ran-text-on-light-muted">
            שלושה סוכנים, מערכת אחת
          </p>
          <h2
            className="mt-4 font-extrabold text-ran-text-on-light"
            style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
          >
            איך כל פנייה הופכת לפגישה
          </h2>
          <p
            className="mt-4 text-ran-text-on-light-muted"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.65 }}
          >
            כל ערוץ עובד באותו תהליך: הפנייה נכנסת, הסוכן מבין מה רוצים ממנו,
            והתוצאה נוחתת אצלכם מסודרת.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {FLOWS.map((flow) => (
            <RevealItem key={flow.uid} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-ran-glass-border-light bg-ran-surface-light-raised shadow-[0_8px_30px_-10px_rgba(17,17,17,0.10)]">
                {/* diagram panel — a soft gradient wash of the agent's own
                    accent, glowing from behind the outcome node (where the
                    colour lives in the drawing itself) out to the neutral
                    surface. A flat ~6% tint read as barely-there once we
                    actually asked for "more present" colour; a gradient
                    gives the same restraint at the edges while still having
                    real presence where it matters. */}
                <div
                  dir="ltr"
                  className="flex min-h-[190px] items-center justify-center border-b border-ran-glass-border-light px-6 py-6"
                  style={{
                    background: `radial-gradient(130% 130% at 82% 20%, color-mix(in srgb, ${flow.accent} 26%, var(--surface-subtle)) 0%, var(--surface-subtle) 68%)`,
                  }}
                >
                  <AgentFlowDiagram
                    uid={flow.uid}
                    sources={flow.sources}
                    sourceLabel={flow.sourceLabel}
                    processorGlyph={flow.processorGlyph}
                    processorLabel={flow.processorLabel}
                    outcomeLabel={flow.outcomeLabel}
                    accent={flow.accent}
                  />
                </div>

                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <h3 className="text-2xl font-bold tracking-tight text-ran-text-on-light">
                    {flow.title}
                  </h3>
                  {/* The special font stays scoped to this one English line —
                      the Hebrew title/checklist tried Secular One too, but
                      that read wrong on real body copy and got reverted.
                      Anton (already loaded site-wide, unused until now) over
                      the earlier Geist Mono: a heavy condensed display face
                      reads as "bolder and different" in a way a mono
                      typeface, built for evenness rather than weight, can't.
                      Kept small (text-xs) — Anton at text-base read as loud/
                      oversized for a one-line subtitle, so the size does the
                      work of keeping it a quiet accent rather than a shout. */}
                  <p className="mt-1 font-anton text-xs tracking-wide text-ran-text-on-light-muted" dir="ltr">
                    {flow.subtitle}
                  </p>
                  <span aria-hidden className="mt-3 block h-0.5 w-12 rounded-full" style={{ backgroundColor: flow.accent }} />

                  {/* A checkmark list is the one thing every SaaS landing
                      page already has — swapped for a small connected-dot
                      timeline instead, echoing the outcome node's own
                      ring-circle treatment in the flow diagram above (same
                      white-fill/accent-ring construction, just smaller), so
                      the checklist reads as part of the same drawn system
                      rather than a bolted-on generic list. */}
                  <ul className="mt-5">
                    {flow.bullets.map((bullet, index) => (
                      <li key={bullet} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < flow.bullets.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute right-[5px] top-[14px] bottom-0 w-px bg-ran-glass-border-light"
                          />
                        )}
                        <span
                          aria-hidden
                          className="relative z-10 mt-0.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 bg-ran-surface-light-raised"
                          style={{ borderColor: flow.accent }}
                        />
                        <span className="text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body)" }}>
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </SectionContainer>
    </section>
  )
}
