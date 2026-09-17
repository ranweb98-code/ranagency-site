"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useInView } from "motion/react"
import { Camera, Check, MessageCircle, Phone, type LucideIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SectionContainer } from "@/components/site/section-container"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

// The abstract source→processor→outcome schematic told you the agent
// answers. This shows it answering: each phone replays real exchanges in its
// channel's own chrome, ending on the thing the business actually cares
// about — a booked slot, a captured number, a lead that didn't go cold.
// Each agent cycles through several conversations rather than looping one,
// because "it handles whatever they ask" is the claim, and one scripted
// exchange on repeat quietly argues the opposite.

type Speaker = "customer" | "agent"

interface Beat {
  from: Speaker
  text: string
  /** How long this beat stays on screen before the next one arrives. */
  hold: number
}

interface Conversation {
  script: Beat[]
  outcome: string
}

interface Agent {
  uid: string
  title: string
  subtitle: string
  accent: string
  icon: LucideIcon
  /** Chrome line under the business name. Voice appends a live call timer. */
  status: string
  conversations: Conversation[]
  traits: string[]
  /** Voice swaps message bubbles for a call transcript + live waveform. */
  isCall?: boolean
}

const AGENTS: Agent[] = [
  {
    uid: "wa",
    title: "סוכן וואטסאפ",
    subtitle: "WhatsApp Agent",
    accent: "#16a34a",
    icon: MessageCircle,
    status: "מקוון · מגיב תוך שניות",
    conversations: [
      {
        script: [
          { from: "customer", text: "היי, כמה עולה טיפול פנים ויש מקום השבוע?", hold: 1700 },
          { from: "agent", text: "היי! טיפול פנים קלאסי 280₪, כולל ניקוי עמוק. פנוי ג׳ ב-14:00 או ה׳ ב-10:30.", hold: 2300 },
          { from: "customer", text: "ג׳ ב-14:00 מעולה", hold: 1500 },
          { from: "agent", text: "קבעתי לך 🙂 אשלח תזכורת יום לפני.", hold: 1900 },
        ],
        outcome: "תור נקבע · ג׳ 14:00 · ליד חם",
      },
      {
        script: [
          { from: "customer", text: "עד מתי אתם פתוחים היום?", hold: 1600 },
          { from: "agent", text: "היום עד 23:00, מטבח אחרון ב-22:15.", hold: 1900 },
          { from: "customer", text: "יש חניה באזור?", hold: 1500 },
          { from: "agent", text: "יש חניון ציבורי דקה הליכה מאיתנו, ואחרי 19:00 החניה ברחוב חופשית.", hold: 2300 },
        ],
        outcome: "נענה אוטומטית · 23:41",
      },
      {
        script: [
          { from: "customer", text: "הזמנתי ביום ראשון, מתי זה מגיע?", hold: 1700 },
          { from: "agent", text: "בדקתי — ההזמנה יצאה אתמול ותגיע מחר עד 18:00.", hold: 2200 },
          { from: "customer", text: "אפשר לשנות כתובת?", hold: 1500 },
          { from: "agent", text: "בטח. שלחי לי את הכתובת החדשה ואעדכן את השליח.", hold: 2100 },
        ],
        outcome: "פנייה טופלה · בלי נציג",
      },
    ],
    traits: [
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
    icon: Camera,
    status: "הודעה פרטית · נענתה",
    conversations: [
      {
        script: [
          { from: "customer", text: "יש משלוח לחיפה?", hold: 1500 },
          { from: "agent", text: "כן, 25₪ עד 3 ימי עסקים. מעל 300₪ המשלוח עלינו.", hold: 2200 },
          { from: "customer", text: "מעולה, אני רוצה להזמין", hold: 1500 },
          { from: "agent", text: "אשמח לקחת פרטים — שם וטלפון?", hold: 1800 },
          { from: "customer", text: "נועה, 054-555-1234", hold: 1600 },
        ],
        outcome: "פרטי קשר נשמרו ב-CRM",
      },
      {
        script: [
          { from: "customer", text: "ראיתי את הפוסט — ה-20 לחודש פנוי אצלכם?", hold: 1800 },
          { from: "agent", text: "כן, ה-20 עדיין פנוי. לכמה אנשים האירוע?", hold: 2000 },
          { from: "customer", text: "בערך 40", hold: 1400 },
          { from: "agent", text: "ל-40 איש החבילה 95₪ לאדם. שומר לך את התאריך ומעביר לרן שיחזור אליך.", hold: 2400 },
        ],
        outcome: "ליד חם · הועבר לטיפול",
      },
      {
        script: [
          { from: "customer", text: "כמה זה עולה?", hold: 1400 },
          { from: "agent", text: "תלוי בדגם — הקלאסי 190₪, הפרימיום 260₪. איזה עניין אותך?", hold: 2300 },
          { from: "customer", text: "הפרימיום", hold: 1400 },
          { from: "agent", text: "שלחתי לך קישור להזמנה, מחכה שם על שמך 🙂", hold: 2100 },
        ],
        outcome: "המרה · קישור נשלח",
      },
    ],
    traits: [
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
    icon: Phone,
    status: "שיחה נכנסת",
    isCall: true,
    conversations: [
      {
        script: [
          { from: "customer", text: "שלום, אפשר לקבוע תור לשבוע הבא?", hold: 1700 },
          { from: "agent", text: "בשמחה. לאיזה טיפול?", hold: 1600 },
          { from: "customer", text: "תספורת וזקן", hold: 1400 },
          { from: "agent", text: "יש לי יום ב׳ ב-9:00 או ד׳ ב-17:30. מה נוח לך?", hold: 2200 },
          { from: "customer", text: "ד׳ ב-17:30", hold: 1400 },
          { from: "agent", text: "קבעתי. שולח אישור ב-SMS, נתראה ביום רביעי.", hold: 2100 },
        ],
        outcome: "תור נקבע ביומן · ד׳ 17:30",
      },
      {
        script: [
          { from: "customer", text: "אני צריך לבטל את התור של מחר", hold: 1700 },
          { from: "agent", text: "מצאתי — מחר ב-11:00 על שם דני. לבטל, או להזיז לתאריך אחר?", hold: 2400 },
          { from: "customer", text: "תזיז, אם אפשר", hold: 1400 },
          { from: "agent", text: "פנוי ב׳ ב-11:00 או ה׳ ב-16:00.", hold: 1900 },
          { from: "customer", text: "ה׳ ב-16:00", hold: 1400 },
          { from: "agent", text: "הזזתי, והמקום של מחר נפתח שוב להזמנות.", hold: 2200 },
        ],
        outcome: "תור הוזז · ה׳ 16:00 · היומן עודכן",
      },
      {
        script: [
          { from: "customer", text: "אתם פתוחים עכשיו?", hold: 1500 },
          { from: "agent", text: "אנחנו סגורים, נפתח מחר ב-9:00. אפשר לעזור במשהו?", hold: 2200 },
          { from: "customer", text: "רציתי לשאול כמה עולה צביעה", hold: 1700 },
          { from: "agent", text: "צביעה מלאה מ-320₪, כולל טיפול לשיקום השיער.", hold: 2200 },
          { from: "customer", text: "טוב, אתקשר מחר", hold: 1500 },
          { from: "agent", text: "רשמתי את הפנייה — נחזור אליך מחר בבוקר.", hold: 2100 },
        ],
        outcome: "ליד נשמר · חזרה מתוזמנת 9:10",
      },
    ],
    traits: [
      "עונה כמו מזכירה אישית",
      "מבין את המתקשר בזמן אמת",
      "קובע, מזיז ומבטל תורים",
      "מסונכרן ליומן שלכם",
    ],
  },
]

const TYPING_MS = 1100
const OUTCOME_HOLD_MS = 3000
const SWITCH_GAP_MS = 500

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
            ככה זה נשמע מהצד של הלקוח
          </h2>
          <p
            className="mt-4 text-ran-text-on-light-muted"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.65 }}
          >
            אותן שיחות שאתם עונים עליהן היום ידנית — מחירים, שעות, תורים, הזמנות —
            רק שהפעם הן נענות מיד, ונגמרות בתור ביומן.
          </p>
        </Reveal>

        {/* Three phones standing side by side is the whole picture — one
            customer, three channels, same answer — so they go abreast at
            md rather than waiting for lg, where a 1000px-wide laptop window
            would still be stacking them into a column. */}
        <div className="grid justify-items-center gap-12 md:grid-cols-3 md:gap-6">
          {AGENTS.map((agent, index) => (
            <AgentCard key={agent.uid} agent={agent} startDelay={index * 900} />
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}

function AgentCard({ agent, startDelay }: { agent: Agent; startDelay: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  // Playback restarts whenever the card comes back into view rather than
  // running once — but it never runs off-screen, the same discipline the
  // growth chart's ping already follows.
  const inView = useInView(cardRef, { amount: 0.35 })
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  const [convIndex, setConvIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [typing, setTyping] = useState(false)

  const conversation = agent.conversations[convIndex]
  const script = conversation.script

  useEffect(() => {
    if (!inView || prefersReducedMotion) return

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    // Scheduled rather than called inline: a synchronous setState in an
    // effect body costs a cascading render, and the thread's own crossfade
    // already covers this tick.
    at(0, () => {
      setStep(0)
      setTyping(false)
    })

    // Only the first conversation waits out the cross-card stagger; after
    // that the phones have already drifted apart on their own.
    let clock = convIndex === 0 ? startDelay : SWITCH_GAP_MS

    script.forEach((beat, i) => {
      if (beat.from === "agent") {
        at(clock, () => setTyping(true))
        clock += TYPING_MS
        at(clock, () => setTyping(false))
      }
      at(clock, () => setStep(i + 1))
      clock += beat.hold
    })

    at(clock, () => setStep(script.length + 1))
    clock += OUTCOME_HOLD_MS
    at(clock, () => setConvIndex((i) => (i + 1) % agent.conversations.length))

    return () => timers.forEach(window.clearTimeout)
  }, [convIndex, inView, prefersReducedMotion, script, agent.conversations.length, startDelay])

  // Off-screen or reduced motion: the finished conversation, no playback.
  const settled = prefersReducedMotion || !inView
  const visibleBeats = settled ? script : script.slice(0, step)
  const showOutcome = settled || step > script.length

  const Icon = agent.icon

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full max-w-[330px] flex-col"
    >
      {/* The device frame is the point: the customer's side of this
          conversation happens on a phone, so the demo is shown on one. */}
      <div className="relative rounded-[2.25rem] border border-ran-glass-border-light bg-ran-surface-light-raised px-2.5 pb-2.5 pt-4 shadow-[0_26px_60px_-28px_rgba(17,17,17,0.45)]">
        <span
          aria-hidden
          className="absolute left-1/2 top-[7px] h-1 w-12 -translate-x-1/2 rounded-full bg-ran-text-on-light/10"
        />

        <div className="overflow-hidden rounded-[1.7rem] border border-ran-glass-border-light">
          {/* chat header — the business as the customer sees it, not the
              agent's product name; that label lives under the phone. */}
          <div
            className="flex items-center gap-2.5 border-b px-3.5 py-3"
            style={{
              borderColor: `color-mix(in srgb, ${agent.accent} 18%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${agent.accent} 7%, var(--surface-raised))`,
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: agent.accent }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ran-text-on-light">נפוץ&apos;</p>
              <p className="truncate text-[10.5px] text-ran-text-on-light-muted">
                {agent.isCall ? (
                  <CallStatus key={convIndex} label={agent.status} running={!settled} />
                ) : (
                  agent.status
                )}
              </p>
            </div>
            {agent.isCall ? (
              <Waveform accent={agent.accent} active={!settled} />
            ) : (
              <span className="relative flex h-2 w-2 shrink-0">
                {!settled && (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: agent.accent }}
                  />
                )}
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: agent.accent }}
                />
              </span>
            )}
          </div>

          {/* Fixed height, bottom-anchored: longer conversations scroll their
              own openings up out of frame exactly like a real thread, and the
              phone never changes size mid-playback. The mask fades whatever
              is clipped instead of guillotining it. */}
          <div
            className="relative h-[330px]"
            style={{
              background: `radial-gradient(120% 120% at 80% 0%, color-mix(in srgb, ${agent.accent} 10%, var(--surface-subtle)) 0%, var(--surface-subtle) 70%)`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={convIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex h-full flex-col justify-end gap-2 px-3 py-4"
                style={{
                  maskImage: "linear-gradient(to bottom, transparent, black 14%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 14%)",
                }}
              >
                {visibleBeats.map((beat, i) => (
                  <Bubble
                    key={`${agent.uid}-${convIndex}-${i}`}
                    beat={beat}
                    accent={agent.accent}
                    isCall={agent.isCall}
                  />
                ))}

                {typing && !settled && <TypingBubble accent={agent.accent} />}

                {showOutcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className="mt-1 flex shrink-0 items-center gap-1.5 self-center rounded-full border bg-ran-surface-light-raised px-3 py-1.5"
                    style={{
                      borderColor: `color-mix(in srgb, ${agent.accent} 35%, transparent)`,
                    }}
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: agent.accent }}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                    </span>
                    <span className="text-[11px] font-bold text-ran-text-on-light">
                      {conversation.outcome}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* label + capabilities, off the device — deliberately quiet: the
          phone above is the argument, this is the footnote */}
      <div className="mt-6 w-full">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-ran-text-on-light">
            {agent.title}
          </h3>
          <span
            dir="ltr"
            className="shrink-0 font-anton text-[11px] tracking-[0.12em]"
            style={{ color: agent.accent }}
          >
            {agent.subtitle}
          </span>
        </div>

        <ul className="mt-3 grid gap-2">
          {agent.traits.map((trait) => (
            <li key={trait} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: agent.accent }}
              />
              <span className="text-[14px] leading-relaxed text-ran-text-on-light-muted">
                {trait}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  )
}

function Bubble({ beat, accent, isCall }: { beat: Beat; accent: string; isCall?: boolean }) {
  const fromAgent = beat.from === "agent"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "max-w-[86%] shrink-0 px-3.5 py-2.5 text-[13.5px] leading-relaxed",
        fromAgent ? "self-end" : "self-start",
        // A call has no chat bubbles — transcript lines get a hairline rule
        // on the speaker's side instead, so the voice card reads as a
        // transcript rather than a fake messaging thread.
        isCall
          ? cn(
              "rounded-lg bg-ran-surface-light-raised",
              fromAgent ? "border-l-2 text-ran-text-on-light" : "border-r-2 text-ran-text-on-light-muted"
            )
          : cn("rounded-2xl", fromAgent ? "rounded-tl-md text-white" : "rounded-tr-md text-ran-text-on-light")
      )}
      style={
        isCall
          ? { borderColor: fromAgent ? accent : "var(--border-subtle)" }
          : fromAgent
            ? { backgroundColor: accent }
            : {
                backgroundColor: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
              }
      }
    >
      {beat.text}
    </motion.div>
  )
}

function TypingBubble({ accent }: { accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 items-center gap-1 self-end rounded-2xl rounded-tl-md px-3.5 py-3"
      style={{ backgroundColor: `color-mix(in srgb, ${accent} 88%, white)` }}
      aria-label="הסוכן מקליד"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  )
}

/** Ticking call duration — the one thing that makes a phone call read as
 *  live rather than transcribed after the fact. Remounted per conversation
 *  by its key, which is what resets the clock: cheaper than resetting state
 *  from inside the effect. */
function CallStatus({ label, running }: { label: string; running: boolean }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return (
    <>
      {label} · <span dir="ltr">{`${mm}:${ss}`}</span>
    </>
  )
}

function Waveform({ accent, active }: { accent: string; active: boolean }) {
  return (
    <span className="flex shrink-0 items-end gap-[3px]" aria-hidden>
      {[0.5, 1, 0.7, 1, 0.6].map((peak, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: accent, height: 14 }}
          animate={active ? { scaleY: [0.3, peak, 0.3] } : { scaleY: 0.3 }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </span>
  )
}
