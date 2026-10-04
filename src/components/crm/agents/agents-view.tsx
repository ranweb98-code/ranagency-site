"use client"

import { Check, Info, Plus } from "lucide-react"
import { useState } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { CHANNELS } from "@/components/crm/ui/channel"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Segmented } from "@/components/crm/ui/segmented"
import { Toggle } from "@/components/crm/ui/toggle"
import { formatMoney } from "@/lib/crm/format"
import type { Channel, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

type Tone = "warm" | "pro" | "light"
type Hours = "always" | "after"

const AGENT_NAME: Record<Channel, string> = { whatsapp: "סוכן וואטסאפ", instagram: "סוכן אינסטגרם", voice: "סוכן טלפוני" }
const CONNECTION: Record<Channel, string> = {
  whatsapp: "מספר וואטסאפ עסקי",
  instagram: "חשבון אינסטגרם עסקי",
  voice: "מספר טלפון + סוכן קולי",
}

// What an owner decides before going live — the order a real onboarding takes.
const CHECKLIST = ["חיבור חשבון הערוץ", "העלאת קטלוג ומחירון", "הגדרת שעות פעילות וטון", "שיחת ניסיון עם הסוכן", "עלייה לאוויר"]

export function AgentsView({ data }: { data: CrmData }) {
  const { pack, tenant, contacts, appointments } = data
  const toast = useToast()
  const [active, setActive] = useState<Record<Channel, boolean>>({ whatsapp: true, instagram: true, voice: true })
  const [tone, setTone] = useState<Record<string, Tone>>({})
  const [hours, setHours] = useState<Record<string, Hours>>({})
  const [rules, setRules] = useState({ price: true, angry: true, owner: true, big: false })
  const bigDeal = Math.round(Math.max(0, ...contacts.map((c) => c.value)) / 2 / 1000) * 1000

  return (
    <div>
      <PageHeader title="הסוכנים" eyebrow="מה כל סוכן יודע, מתי הוא עונה, ומתי הוא קורא לך" />

      <Glass className="mb-3 flex items-start gap-3 p-4 md:mb-4 md:items-center md:p-5">
        <Info className="mt-0.5 size-5 shrink-0 md:mt-0" aria-hidden />
        <p className="text-[13px] leading-relaxed text-crm-ink/80">
          זהו מצב הדגמה: הנתונים כאן הם נתוני דוגמה. בלקוח אמיתי כל כרטיס מחובר לערוץ החי (וואטסאפ, אינסטגרם, טלפון) והמספרים מגיעים מהשיחות עצמן.
        </p>
      </Glass>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:col-span-8 lg:content-start">
          {tenant.agents.map((channel) => {
            const mine = contacts.filter((c) => c.channel === channel)
            const booked = appointments.filter((a) => mine.some((c) => c.id === a.contactId)).length
            const avg = mine.length ? Math.round(mine.reduce((s, c) => s + c.firstReplySeconds, 0) / mine.length) : 0
            const { icon: Icon, color } = CHANNELS[channel]
            const on = active[channel]
            return (
              <Glass key={channel} className={cn("p-4 transition-opacity md:p-5", !on && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: color }}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] font-medium">{AGENT_NAME[channel]}</h2>
                    <p className="flex items-center gap-1.5 text-xs text-crm-muted">
                      <span className={cn("size-2 rounded-full", on ? "crm-live-dot bg-[#22c55e]" : "bg-black/30")} />
                      {on ? "פעיל ועונה עכשיו" : "מושבת"} · {CONNECTION[channel]}
                    </p>
                  </div>
                  <Toggle
                    checked={on}
                    label={`הפעלת ${AGENT_NAME[channel]}`}
                    onChange={(next) => {
                      setActive((a) => ({ ...a, [channel]: next }))
                      toast(next ? `${AGENT_NAME[channel]} חזר לענות (הדגמה)` : `${AGENT_NAME[channel]} הושבת (הדגמה)`)
                    }}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "שיחות", value: String(mine.length) },
                    { label: "זמן מענה", value: `${avg} שנ׳` },
                    { label: "לידים חמים", value: String(mine.filter((c) => c.temperature === "hot").length) },
                    { label: pack.vocab.bookings, value: String(booked) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-black/[0.045] px-3.5 py-3">
                      <dt className="text-[11px] text-crm-muted">{s.label}</dt>
                      <dd className="mt-0.5 text-[20px] font-medium tabular-nums">{s.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <p className="mb-1.5 text-[11px] text-crm-muted">טון דיבור</p>
                    <Segmented<Tone>
                      label={`טון של ${AGENT_NAME[channel]}`}
                      value={tone[channel] ?? "warm"}
                      onChange={(v) => setTone((t) => ({ ...t, [channel]: v }))}
                      options={[
                        { value: "warm", label: "חם" },
                        { value: "pro", label: "מקצועי" },
                        { value: "light", label: "קליל" },
                      ]}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] text-crm-muted">מתי עונה</p>
                    <Segmented<Hours>
                      label={`שעות של ${AGENT_NAME[channel]}`}
                      value={hours[channel] ?? "always"}
                      onChange={(v) => setHours((h) => ({ ...h, [channel]: v }))}
                      options={[
                        { value: "always", label: "תמיד" },
                        { value: "after", label: "מחוץ לשעות הפעילות" },
                      ]}
                    />
                  </div>
                </div>
              </Glass>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:col-span-4 lg:content-start">
          <SectionCard title="מה הסוכנים יודעים" actions={<Pill tone="soft">{pack.knowledge.length} מקורות</Pill>}>
            <ul className="space-y-1.5">
              {pack.knowledge.map((k) => (
                <li key={k} className="flex items-center gap-2.5 rounded-2xl bg-black/[0.045] px-3.5 py-2.5 text-[13px]">
                  <Check className="size-4 shrink-0" aria-hidden />
                  {k}
                </li>
              ))}
              <li>
                <button type="button" onClick={() => toast("הוספת מקורות ידע תופעל עם חיבור למסד הנתונים")} className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-black/20 px-3.5 py-2.5 text-[13px] text-crm-ink/70 transition-colors hover:bg-white/50">
                  <Plus className="size-4" aria-hidden />
                  הוספת מקור ידע
                </button>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="מתי הסוכן קורא לך">
            <ul className="space-y-2.5">
              {[
                { key: "price" as const, label: "שאלה על מחיר חריג או הנחה" },
                { key: "angry" as const, label: "לקוח כועס או מתלונן" },
                { key: "owner" as const, label: "מבקשים לדבר איתך אישית" },
                { key: "big" as const, label: `עסקה מעל ${formatMoney(bigDeal)}` },
              ].map((rule) => (
                <li key={rule.key} className="flex items-center justify-between gap-3">
                  <span className="text-[13px]">{rule.label}</span>
                  <Toggle checked={rules[rule.key]} label={rule.label} onChange={(v) => setRules((r) => ({ ...r, [rule.key]: v }))} />
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="הקמה של לקוח חדש" actions={<Pill tone="warm">5 שלבים</Pill>}>
            <ol className="space-y-2">
              {CHECKLIST.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-[13px]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-crm-ink text-[11px] font-medium text-white">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
