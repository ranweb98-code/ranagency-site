"use client"

import { ArrowUpLeft, Check, ChevronDown, Info, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition, type ReactNode } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { areaClass, fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { Glass } from "@/components/crm/ui/glass"
import { IconButton } from "@/components/crm/ui/icon-button"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Segmented } from "@/components/crm/ui/segmented"
import { Select } from "@/components/crm/ui/select"
import { Toggle } from "@/components/crm/ui/toggle"
import { buildAgentBrief, type BriefCatalogItem } from "@/lib/crm/agent-brief"
import {
  DAYS,
  LIMITS,
  TONES,
  profileProgress,
  type BusinessIdentity,
  type BusinessProfile,
  type DayHours,
  type DayKey,
  type ProfileForm,
} from "@/lib/crm/profile"
import { cn } from "@/lib/utils"

type SaveResult = { ok: true } | { ok: false; error: string }

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const time = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`
  return { value: time, label: time }
})
const DEFAULT_DAY: DayHours = { open: "09:00", close: "18:00" }

const ESCALATIONS = [
  { key: "price", label: "שאלה על מחיר חריג או הנחה" },
  { key: "angry", label: "לקוח כועס או מתלונן" },
  { key: "owner", label: "הלקוח מבקש לדבר איתך אישית" },
] as const

function Field({ label, hint, count, max, children }: { label: string; hint?: string; count?: number; max?: number; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 px-1 text-[12px] text-crm-muted">
        <span>{label}</span>
        {max !== undefined && count !== undefined && count > max * 0.8 ? <span className={cn("tabular-nums", count > max && "text-[#b3261e]")}>{count}/{max}</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block px-1 text-[11px] text-crm-muted">{hint}</span> : null}
    </label>
  )
}

function Group({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <SectionCard title={title} actions={<span />} className={className}>
      <div className="space-y-4">{children}</div>
    </SectionCard>
  )
}

export function ProfileView({
  identity: initialIdentity,
  initialProfile,
  packLabel,
  knowledge,
  catalog,
  catalogHref,
  canEdit,
  save,
}: {
  identity: BusinessIdentity
  initialProfile: BusinessProfile
  packLabel: string
  knowledge: string[]
  catalog: BriefCatalogItem[]
  catalogHref: string
  canEdit: boolean
  save: (form: ProfileForm) => Promise<SaveResult>
}) {
  const toast = useToast()
  const router = useRouter()
  const [identity, setIdentity] = useState(initialIdentity)
  const [profile, setProfile] = useState(initialProfile)
  const [saved, setSaved] = useState(() => JSON.stringify({ identity: initialIdentity, profile: initialProfile }))
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const dirty = JSON.stringify({ identity, profile }) !== saved
  const progress = profileProgress(profile, catalog.length)
  const brief = buildAgentBrief({ identity, packLabel, profile, catalog })

  // A half-typed profile is easy to lose with one stray tap on a phone.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const setP = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => setProfile((p) => ({ ...p, [key]: value }))
  const setId = (key: keyof BusinessIdentity, value: string) => setIdentity((i) => ({ ...i, [key]: value }))
  const setDay = (key: DayKey, hours: DayHours | null) => setProfile((p) => ({ ...p, hours: { ...p.hours, [key]: hours } }))
  const setFaq = (index: number, patch: Partial<{ q: string; a: string }>) =>
    setProfile((p) => ({ ...p, faq: p.faq.map((item, i) => (i === index ? { ...item, ...patch } : item)) }))

  const usualHours = () =>
    setProfile((p) => ({
      ...p,
      hours: { sun: DEFAULT_DAY, mon: DEFAULT_DAY, tue: DEFAULT_DAY, wed: DEFAULT_DAY, thu: DEFAULT_DAY, fri: null, sat: null },
    }))

  const submit = () => {
    setError(null)
    const snapshot = JSON.stringify({ identity, profile })
    startTransition(async () => {
      const result = await save({ identity, profile })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved(snapshot)
      toast("הפרופיל נשמר")
      router.refresh()
    })
  }

  return (
    <div>
      <PageHeader title="פרופיל העסק" eyebrow="המידע שהסוכנים נשענים עליו" />

      {!canEdit ? (
        <Glass className="mb-3 flex items-start gap-3 p-4 md:mb-4 md:items-center md:p-5">
          <Info className="mt-0.5 size-5 shrink-0 md:mt-0" aria-hidden />
          <p className="text-[13px] leading-relaxed text-crm-ink/80">רק בעלי העסק יכולים לערוך את הפרופיל. אפשר לראות כאן מה כתוב ומה הסוכנים יידעו.</p>
        </Glass>
      ) : null}

      <Glass className="mb-3 p-4 md:mb-4 md:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium">כמה העסק מוכן לסוכנים</h2>
          <span className="text-[22px] font-medium tabular-nums">{progress.percent}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/[0.08]" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="התקדמות הפרופיל">
          <div className="h-full rounded-full bg-crm-ink transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {progress.items.map((item) => (
            <li key={item.key} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium", item.done ? "bg-crm-ink text-white" : "bg-black/[0.07] text-crm-ink/70")}>
              {item.done ? <Check className="size-3.5" aria-hidden /> : null}
              {item.label}
            </li>
          ))}
        </ul>
        {knowledge.length ? <p className="mt-3 text-[12px] leading-relaxed text-crm-muted">בתחום שלכם הסוכנים נשענים בדרך כלל על: {knowledge.join(" · ")}.</p> : null}
      </Glass>

      <fieldset disabled={!canEdit || pending} className="contents">
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
          <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 lg:col-span-8 lg:content-start">
            <Group title="על העסק">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="שם העסק" count={identity.businessName.length} max={LIMITS.businessName}>
                  <input value={identity.businessName} onChange={(e) => setId("businessName", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
                <Field label="שם בעל העסק" count={identity.ownerName.length} max={LIMITS.ownerName}>
                  <input value={identity.ownerName} onChange={(e) => setId("ownerName", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
                <Field label="עיר" count={identity.city.length} max={LIMITS.city}>
                  <input value={identity.city} onChange={(e) => setId("city", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
                <Field label="משפט קצר על העסק" count={identity.tagline.length} max={LIMITS.tagline}>
                  <input value={identity.tagline} onChange={(e) => setId("tagline", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
              </div>
              <Field label="מה העסק עושה, ומה מיוחד בו" hint="הסוכן משתמש בזה כדי להציג אתכם נכון. כמה משפטים מספיקים." count={profile.about.length} max={LIMITS.about}>
                <textarea value={profile.about} onChange={(e) => setP("about", e.target.value)} rows={4} className={areaClass} />
              </Field>
            </Group>

            <Group title="שעות פעילות">
              <ul className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const day = profile.hours[key]
                  return (
                    <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full bg-black/[0.045] py-1.5 ps-4 pe-2">
                      <span className="w-14 text-[13px] font-medium">{label}</span>
                      <Toggle checked={Boolean(day)} onChange={(on) => setDay(key, on ? DEFAULT_DAY : null)} label={`${label}: פתוח`} />
                      {day ? (
                        <div className="flex items-center gap-2">
                          <Select variant="pill" label={`${label}: שעת פתיחה`} value={day.open} onChange={(v) => setDay(key, { ...day, open: v })} options={TIMES} />
                          <span aria-hidden className="text-crm-muted">–</span>
                          <Select variant="pill" label={`${label}: שעת סגירה`} value={day.close} onChange={(v) => setDay(key, { ...day, close: v })} options={TIMES} />
                        </div>
                      ) : (
                        <span className="text-[13px] text-crm-muted">סגור</span>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={usualHours} className="rounded-full bg-black/[0.07] px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.11] disabled:opacity-50">
                  ראשון–חמישי, 09:00–18:00
                </button>
              </div>
              <Field label="הערה לשעות" hint="למשל: ערבי חג עד 14:00, או: בשבת רק בתיאום." count={profile.hoursNote.length} max={LIMITS.hoursNote}>
                <input value={profile.hoursNote} onChange={(e) => setP("hoursNote", e.target.value)} autoComplete="off" className={fieldClass} />
              </Field>
            </Group>

            <Group title="איך מגיעים ויוצרים קשר">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="כתובת" count={profile.address.length} max={LIMITS.address}>
                  <input value={profile.address} onChange={(e) => setP("address", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
                <Field label="הוראות הגעה וחניה" count={profile.directions.length} max={LIMITS.directions}>
                  <input value={profile.directions} onChange={(e) => setP("directions", e.target.value)} autoComplete="off" className={fieldClass} />
                </Field>
                <Field label="טלפון ללקוחות">
                  <input value={profile.phone} onChange={(e) => setP("phone", e.target.value)} inputMode="tel" dir="ltr" autoComplete="off" className={cn(fieldClass, "text-end")} />
                </Field>
                <Field label="מייל ללקוחות">
                  <input value={profile.email} onChange={(e) => setP("email", e.target.value)} type="email" dir="ltr" autoComplete="off" className={cn(fieldClass, "text-end")} />
                </Field>
              </div>
            </Group>

            <Group title="מדיניות">
              <Field label="ביטולים ושינויים" hint="למשל: ביטול עד 24 שעות מראש ללא עלות." count={profile.cancellation.length} max={LIMITS.policy}>
                <textarea value={profile.cancellation} onChange={(e) => setP("cancellation", e.target.value)} rows={2} className={areaClass} />
              </Field>
              <Field label="תשלום" hint="אמצעי תשלום, מקדמה, חשבונית." count={profile.payment.length} max={LIMITS.policy}>
                <textarea value={profile.payment} onChange={(e) => setP("payment", e.target.value)} rows={2} className={areaClass} />
              </Field>
              <Field label="מה הסוכן לא אומר" hint="דברים שאסור לו להבטיח, להתחייב אליהם או לדבר עליהם." count={profile.neverSay.length} max={LIMITS.neverSay}>
                <textarea value={profile.neverSay} onChange={(e) => setP("neverSay", e.target.value)} rows={2} className={areaClass} />
              </Field>
            </Group>

            <Group title="שאלות נפוצות">
              <p className="-mt-1 text-[13px] leading-relaxed text-crm-ink/70">השאלות שלקוחות שואלים שוב ושוב, והתשובה שאתם רוצים שהסוכן ייתן.</p>
              <ul className="space-y-3">
                {profile.faq.map((item, index) => (
                  <li key={index} className="space-y-2 rounded-[26px] bg-black/[0.045] p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={item.q}
                        onChange={(e) => setFaq(index, { q: e.target.value })}
                        placeholder="שאלה"
                        aria-label={`שאלה ${index + 1}`}
                        autoComplete="off"
                        className={cn(fieldClass, "min-w-0 flex-1")}
                      />
                      <IconButton label={`מחיקת שאלה ${index + 1}`} size="md" onClick={() => setProfile((p) => ({ ...p, faq: p.faq.filter((_, i) => i !== index) }))}>
                        <Trash2 />
                      </IconButton>
                    </div>
                    <textarea
                      value={item.a}
                      onChange={(e) => setFaq(index, { a: e.target.value })}
                      placeholder="תשובה"
                      aria-label={`תשובה ${index + 1}`}
                      rows={2}
                      className={areaClass}
                    />
                  </li>
                ))}
              </ul>
              {profile.faq.length < LIMITS.faqCount ? (
                <button
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, faq: [...p.faq, { q: "", a: "" }] }))}
                  className="flex items-center gap-2 rounded-full border border-dashed border-black/20 px-5 py-2.5 text-[13px] font-medium text-crm-ink/80 transition-colors hover:bg-white/50 disabled:opacity-50"
                >
                  <Plus className="size-4" aria-hidden />
                  הוספת שאלה
                </button>
              ) : null}
            </Group>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 lg:col-span-4 lg:content-start">
            <Group title="איך הסוכן מדבר">
              <div>
                <p className="mb-1.5 px-1 text-[12px] text-crm-muted">טון</p>
                <Segmented label="טון הדיבור" value={profile.tone} onChange={(v) => setP("tone", v)} options={TONES.map((t) => ({ value: t.value, label: t.label }))} />
                <p className="mt-2 px-1 text-[12px] text-crm-muted">{TONES.find((t) => t.value === profile.tone)?.hint}</p>
              </div>
              <Field label="שם הסוכן" hint="אם תרצו שיציג את עצמו בשם." count={profile.agentName.length} max={LIMITS.agentName}>
                <input value={profile.agentName} onChange={(e) => setP("agentName", e.target.value)} autoComplete="off" className={fieldClass} />
              </Field>
              <div>
                <p className="mb-1.5 px-1 text-[12px] text-crm-muted">מתי הוא עונה</p>
                <Segmented
                  label="מתי הסוכן עונה"
                  value={profile.answerMode}
                  onChange={(v) => setP("answerMode", v)}
                  options={[
                    { value: "always", label: "תמיד" },
                    { value: "after_hours", label: "מחוץ לשעות הפעילות" },
                  ]}
                />
              </div>
            </Group>

            <Group title="מתי הסוכן קורא לך">
              <ul className="space-y-2.5">
                {ESCALATIONS.map((rule) => (
                  <li key={rule.key} className="flex items-center justify-between gap-3">
                    <span className="text-[13px]">{rule.label}</span>
                    <Toggle checked={profile.escalate[rule.key]} onChange={(on) => setP("escalate", { ...profile.escalate, [rule.key]: on })} label={rule.label} />
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3">
                  <span className="text-[13px]">עסקה גדולה</span>
                  <Toggle checked={profile.escalate.bigDeal} onChange={(on) => setP("escalate", { ...profile.escalate, bigDeal: on })} label="עסקה גדולה" />
                </li>
              </ul>
              {profile.escalate.bigDeal ? (
                <Field label="מעל איזה סכום (בשקלים)">
                  <span className="relative block">
                    <span aria-hidden className="pointer-events-none absolute inset-y-0 start-5 grid place-items-center text-[15px] text-crm-muted">
                      ₪
                    </span>
                    <input
                      value={profile.bigDealThreshold ? String(profile.bigDealThreshold) : ""}
                      onChange={(e) => setP("bigDealThreshold", Math.min(LIMITS.threshold, Number(e.target.value.replace(/\D/g, "")) || 0))}
                      inputMode="numeric"
                      autoComplete="off"
                      className={cn(fieldClass, "ps-11")}
                    />
                  </span>
                </Field>
              ) : null}
            </Group>

            <Group title="קטלוג ומחירים">
              <p className="text-[13px] leading-relaxed text-crm-ink/70">הפריטים והמחירים שהסוכן מציע מנוהלים בקטלוג, והם נכנסים לבד למה שהסוכן יודע.</p>
              <div className="flex items-center justify-between gap-3">
                <Pill tone={catalog.length ? "ink" : "soft"}>{catalog.length ? `${catalog.length} פריטים` : "עוד אין פריטים"}</Pill>
                <Link href={catalogHref} className="flex items-center gap-1.5 rounded-full bg-black/[0.07] px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/[0.11]">
                  לקטלוג <ArrowUpLeft className="size-3.5" aria-hidden />
                </Link>
              </div>
            </Group>
          </div>
        </div>
      </fieldset>

      <Glass className="mt-3 p-4 md:mt-4 md:p-5">
        <button
          type="button"
          onClick={() => setPreviewOpen((o) => !o)}
          aria-expanded={previewOpen}
          aria-controls="agent-brief"
          className="flex w-full items-center justify-between gap-3 text-start"
        >
          <span>
            <span className="block text-[15px] font-medium">מה הסוכנים יידעו</span>
            <span className="mt-0.5 block text-[12px] text-crm-muted">כך ייראה המידע שהסוכנים יקבלו, ומתעדכן תוך כדי העריכה. החיבור לסוכנים עצמם עוד לא פעיל.</span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 transition-transform duration-200", previewOpen && "rotate-180")} aria-hidden />
        </button>
        {previewOpen ? (
          <pre id="agent-brief" dir="rtl" className="crm-scroll mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-[26px] bg-black/[0.045] p-4 text-[13px] leading-relaxed [font-family:inherit]">
            {brief}
          </pre>
        ) : null}
      </Glass>

      {canEdit ? (
        <div className="sticky bottom-24 z-30 mt-4 md:bottom-4">
          <Glass className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full p-2 ps-5 backdrop-blur-xl">
            <p role="status" className={cn("min-w-0 truncate text-[13px]", error ? "text-[#b3261e]" : "text-crm-ink/70")}>
              {error ?? (pending ? "שומר…" : dirty ? "יש שינויים שלא נשמרו" : "הכל שמור")}
            </p>
            <button type="button" onClick={submit} disabled={!dirty || pending} className={cn(primaryButtonClass, "shrink-0 py-3")}>
              {pending ? "שומר…" : "שמירה"}
            </button>
          </Glass>
        </div>
      ) : null}
    </div>
  )
}
