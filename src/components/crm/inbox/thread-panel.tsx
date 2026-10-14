"use client"

import { ArrowRight, Bot, MessageCircle, Phone, Send, Sparkles, UserRound } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { Avatar } from "@/components/crm/ui/avatar"
import { CHANNELS, ChannelTag } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { IconButton } from "@/components/crm/ui/icon-button"
import { ItemCard } from "@/components/crm/ui/item-card"
import { Pill } from "@/components/crm/ui/pill"
import { Segmented } from "@/components/crm/ui/segmented"
import { TEMPERATURE, TemperatureTag } from "@/components/crm/ui/temperature"
import { Timeline } from "@/components/crm/ui/timeline"
import { dayDiff, formatDayShort, formatDuration, formatMoney, formatRelative, formatTime, toDayKey } from "@/lib/crm/format"
import { telLink, whatsappLink } from "@/lib/crm/phone"
import type { CatalogItem, Contact, CrmData, Message, Temperature } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

type Mode = "agent" | "human"

export function ThreadPanel({ data, contact, className, onBack }: { data: CrmData; contact: Contact; className?: string; onBack: () => void }) {
  const toast = useToast()
  const { pack } = data
  const item = data.catalog.find((c) => c.id === contact.itemId)
  const itemById = useMemo(() => new Map(data.catalog.map((c) => [c.id, c])), [data.catalog])
  const base = data.basePath
  // Sending, and handing a conversation between agent and human, need the
  // channel connection; until it exists a real workspace shows state, not dials.
  const live = !data.demo

  const [mode, setMode] = useState<Mode>(contact.handledBy)
  const [sent, setSent] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useMemo(() => [...contact.messages, ...sent].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)), [contact.messages, sent])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  const stageIndex = pack.stages.findIndex((s) => s.id === contact.stageId)
  const intent = stageIndex >= pack.bookedFromStage ? `קביעת ${pack.vocab.booking}` : "בירור מחיר וזמינות"
  const nextStep =
    stageIndex < pack.bookedFromStage
      ? `להציע מועד ל${pack.vocab.booking} ולשלוח פרטים נוספים`
      : `לוודא הגעה ולהכין את השלב הבא: ${pack.stages[Math.min(stageIndex + 1, pack.stages.length - 1)].label}`

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSent((prev) => [...prev, { id: `local-${prev.length}`, from: "human", text, at: new Date().toISOString() }])
    setDraft("")
    if (sent.length === 0) toast("בהדגמה ההודעה מופיעה כאן בלבד ולא נשלחת ללקוח")
  }

  return (
    <>
      <Glass className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
        {/* header */}
        <header className="flex items-center gap-3 border-b border-black/[0.06] px-3.5 py-3 md:px-5">
          <IconButton label="חזרה לרשימה" size="md" onClick={onBack} className="lg:hidden">
            <ArrowRight />
          </IconButton>
          <Avatar name={contact.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`${base}/contacts/${contact.id}`} className="truncate text-[15px] font-medium hover:underline">
                {contact.name}
              </Link>
            </div>
            <p className="truncate text-xs text-crm-muted">
              {contact.phone ? <bdi dir="ltr">{contact.phone}</bdi> : "אין מספר טלפון"} · {pack.stages[stageIndex]?.label}
            </p>
          </div>

          {live ? (
            <Pill tone="soft">{contact.handledBy === "human" ? "אצלכם" : "אצל הסוכן"}</Pill>
          ) : (
            <Segmented<Mode>
              label="מי מנהל את השיחה"
              value={mode}
              onChange={(next) => {
                setMode(next)
                toast(next === "human" ? "השיחה אצלכם. הסוכן ממתין בצד." : "הסוכן חזר לנהל את השיחה.")
              }}
              options={[
                { value: "agent", label: "סוכן" },
                { value: "human", label: "אני" },
              ]}
            />
          )}
        </header>

        {/* Below the wide layout there is no side column, so the lead's tags and the call buttons sit in a strip of their own. */}
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-3.5 py-2 md:px-5 xl:hidden">
          <TemperatureTag temperature={contact.temperature} />
          <ChannelTag channel={contact.channel} />
          <span className="flex-1" />
          <ReachButtons contact={contact} live={live} />
        </div>

        {/* messages */}
        <div className="crm-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-4 md:px-5">
          <div className="mb-3 rounded-[22px] bg-white/70 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="size-3.5" aria-hidden />
              סיכום AI
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed">{contact.summary || "הסיכום יופיע אחרי שתתנהל שיחה."}</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              <li><Pill tone="soft">כוונה: {intent}</Pill></li>
              <li><Pill tone="warm">שווי משוער {formatMoney(contact.value)}</Pill></li>
              {contact.tags.map((t) => (
                <li key={t}><Pill tone="soft">{t}</Pill></li>
              ))}
            </ul>
            <p className="mt-2.5 text-xs text-crm-muted">הצעד הבא: {nextStep}</p>
          </div>

          {contact.channel === "voice" && contact.callSeconds ? <CallCard seconds={contact.callSeconds} seed={contact.id} /> : null}

          {messages.map((message, index) => {
            const showDay = index === 0 || toDayKey(message.at) !== toDayKey(messages[index - 1].at)
            return (
              <div key={message.id}>
                {showDay ? <DayDivider iso={message.at} now={data.now} /> : null}
                <Bubble message={message} attachment={message.attachmentItemId ? itemById.get(message.attachmentItemId) : undefined} channel={contact.channel} />
              </div>
            )
          })}
          {messages.length === 0 ? <p className="py-6 text-center text-[13px] text-crm-muted">עוד אין הודעות בשיחה הזו.</p> : null}
          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <form onSubmit={submit} className="border-t border-black/[0.06] p-3 md:p-4">
          {live ? (
            <p className="mb-2 flex items-center gap-1.5 px-2 text-[11px] text-crm-muted">
              <Bot className="size-3.5" aria-hidden />
              שליחת הודעות מכאן תיפתח עם חיבור הערוצים.
            </p>
          ) : mode === "agent" ? (
            <p className="mb-2 flex items-center gap-1.5 px-2 text-[11px] text-crm-muted">
              <Bot className="size-3.5" aria-hidden />
              הסוכן מטפל בשיחה. עברו ל״אני״ כדי לכתוב בעצמכם.
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={live || mode === "agent"}
              aria-label="כתיבת הודעה"
              placeholder={live ? "שליחה תיפתח עם חיבור הערוצים" : mode === "agent" ? "הסוכן עונה…" : `הודעה ל${contact.name.split(" ")[0]}…`}
              className="min-w-0 flex-1 rounded-full bg-black/[0.06] px-5 py-3 text-sm outline-none transition-colors placeholder:text-crm-muted focus:bg-white disabled:opacity-60"
            />
            <IconButton label="שליחה" type="submit" tone="ink" size="lg" disabled={live || mode === "agent" || !draft.trim()}>
              <Send className="rtl:-scale-x-100" />
            </IconButton>
          </div>
        </form>
      </Glass>

      {/* context column — wide screens only; the full card is one tap away */}
      <aside className="hidden min-h-0 xl:block" aria-label="הקשר ופעילות">
        <Glass className="flex h-full flex-col overflow-hidden">
         <div className="crm-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <LeadStatus contact={contact} now={data.now} stage={pack.stages[stageIndex]?.label} live={live} />
          {item ? (
            <div className="mt-4">
              <ItemCard item={item} icon={pack.catalogIcon} label={`${pack.vocab.catalogItem} שמעניין`} />
            </div>
          ) : null}
          <h3 className="mb-2 mt-5 text-[13px] font-medium">פעילות</h3>
          <Timeline events={contact.timeline} now={data.now} />
         </div>
        </Glass>
      </aside>
    </>
  )
}

/** Call / WhatsApp from the thread. In the demo the numbers are made up and could belong to
 *  a real person, so there the buttons explain themselves instead of dialling. */
function ReachButtons({ contact, live, wide }: { contact: Contact; live: boolean; wide?: boolean }) {
  const toast = useToast()
  const tel = live ? telLink(contact.phone) : null
  const wa = live ? whatsappLink(contact.phone) : null
  if (!contact.phone) return null
  const demo = () => toast("בהדגמה המספרים בדויים ולכן לא מתקשרים באמת. בעסק אמיתי הכפתור מחייג או פותח צ׳אט.")
  const base = "inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"
  const size = wide ? "flex-1 px-3 py-2.5" : "size-9 md:size-auto md:px-3.5 md:py-2"
  const label = (text: string) => <span className={wide ? "" : "max-md:sr-only"}>{text}</span>
  return (
    <div className={cn("flex items-center gap-1.5", wide && "w-full")}>
      {tel ? (
        <a href={tel} className={cn(base, size, "bg-crm-ink text-white hover:opacity-90")}>
          <Phone className="size-3.5" aria-hidden />
          {label("התקשר")}
        </a>
      ) : (
        <button type="button" onClick={demo} className={cn(base, size, "bg-crm-ink text-white hover:opacity-90")}>
          <Phone className="size-3.5" aria-hidden />
          {label("התקשר")}
        </button>
      )}
      {wa || !live ? (
        wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(base, size, "bg-[#16a34a] text-white hover:opacity-90")}>
            <MessageCircle className="size-3.5" aria-hidden />
            {label("וואטסאפ")}
          </a>
        ) : (
          <button type="button" onClick={demo} className={cn(base, size, "bg-[#16a34a] text-white hover:opacity-90")}>
            <MessageCircle className="size-3.5" aria-hidden />
            {label("וואטסאפ")}
          </button>
        )
      ) : null}
    </div>
  )
}

const ORDER: Temperature[] = ["cold", "warm", "hot"]

/** Where this lead stands, said three ways: the temperature in words, on a scale, and what to do. */
function LeadStatus({ contact, now, stage, live }: { contact: Contact; now: string; stage?: string; live: boolean }) {
  const t = TEMPERATURE[contact.temperature]
  const reachable = contact.phone ? `טלפון ווואטסאפ${contact.channel === "voice" ? "" : `, ${CHANNELS[contact.channel].label}`}` : `רק דרך ${CHANNELS[contact.channel].label}`
  return (
    <section aria-label="מצב הליד" className="rounded-[22px] bg-white/70 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-medium">מצב הליד</h3>
        <TemperatureTag temperature={contact.temperature} className="text-xs" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1" role="img" aria-label={`חום הליד: ${t.label}`}>
        {ORDER.map((level) => (
          <div key={level}>
            <span className={cn("block h-2 rounded-full", ORDER.indexOf(level) <= ORDER.indexOf(contact.temperature) ? TEMPERATURE[contact.temperature].solid : "bg-black/[0.08]")} />
            <span className={cn("mt-1 block text-center text-[10px]", level === contact.temperature ? "font-semibold text-crm-ink" : "text-crm-muted")}>{TEMPERATURE[level].label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed">{t.hint}</p>
      {contact.phone ? null : (
        <p className="mt-2 rounded-2xl bg-black/[0.05] px-3 py-2 text-xs leading-relaxed">
          הליד עוד לא השאיר מספר טלפון, ולכן אי אפשר להתקשר או לכתוב לו בוואטסאפ. אפשר לפנות רק דרך {CHANNELS[contact.channel].label}. כשיעביר מספר, הכפתורים יופיעו כאן.
        </p>
      )}
      <dl className="mt-3 space-y-1.5 text-xs">
        {stage ? (
          <div className="flex justify-between gap-3">
            <dt className="text-crm-muted">שלב</dt>
            <dd className="font-medium">{stage}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-crm-muted">אפשר לפנות</dt>
          <dd className="font-medium">{reachable}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-crm-muted">מטפל</dt>
          <dd className="font-medium">{contact.handledBy === "human" ? "אתם" : "הסוכן"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-crm-muted">קשר אחרון</dt>
          <dd className="font-medium">{formatRelative(contact.lastContactAt, now)}</dd>
        </div>
      </dl>
      <div className="mt-3.5">
        <ReachButtons contact={contact} live={live} wide />
      </div>
    </section>
  )
}

function DayDivider({ iso, now }: { iso: string; now: string }) {
  const diff = dayDiff(iso, now)
  const label = diff === 0 ? "היום" : diff === -1 ? "אתמול" : formatDayShort(iso)
  return (
    <p className="my-3 text-center text-[10.5px] text-crm-muted">
      <span className="rounded-full bg-black/[0.05] px-3 py-1">{label}</span>
    </p>
  )
}

function Bubble({ message, attachment, channel }: { message: Message; attachment?: CatalogItem; channel: Contact["channel"] }) {
  const mine = message.from !== "customer"
  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      {/* In RTL "start" is the right edge: the business sits on the right, the
          customer on the left — the mirror of the reference, correctly. */}
      <div className={cn("max-w-[86%] space-y-1.5 sm:max-w-[72%]")}>
        {attachment ? <ItemCard item={attachment} compact /> : null}
        <div
          className={cn(
            "rounded-[22px] px-4 py-2.5 text-[13.5px] leading-relaxed",
            message.from === "customer" && "rounded-ee-md bg-white text-crm-ink",
            message.from === "agent" && "rounded-es-md bg-crm-accent text-white",
            message.from === "human" && "rounded-es-md bg-crm-ink text-white",
          )}
        >
          {message.text}
        </div>
        <p className={cn("flex items-center gap-1.5 px-1 text-[10px] text-crm-muted", mine ? "justify-start" : "justify-end")}>
          {message.from === "agent" ? <Bot className="size-3" aria-label="הסוכן" /> : message.from === "human" ? <UserRound className="size-3" aria-label="אתם" /> : null}
          {formatTime(message.at)}
          {message.from === "customer" ? ` · ${CHANNELS[channel].label}` : ""}
        </p>
      </div>
    </div>
  )
}

function CallCard({ seconds, seed }: { seconds: number; seed: string }) {
  const bars = Array.from({ length: 36 }, (_, i) => 20 + ((seed.charCodeAt(i % seed.length) * (i + 3)) % 70))
  return (
    <div className="mb-2 flex items-center gap-3 rounded-[22px] bg-white/70 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-crm-ink text-white">
        <Bot className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">שיחה טלפונית · {formatDuration(seconds)}</p>
        <div className="mt-1.5 flex h-5 items-center gap-[2px]" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-crm-ink/35" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <span className="text-[10.5px] text-crm-muted">תמלול מלא למטה</span>
    </div>
  )
}
