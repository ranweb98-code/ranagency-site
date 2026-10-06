"use client"

import { ArrowUpLeft, Check, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent, type ReactNode } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { PageHeader } from "@/components/crm/ui/page-header"
import { SectionCard } from "@/components/crm/ui/section-card"
import { ACCOUNT_LIMITS, validateAccount } from "@/lib/crm/account"
import { BRAND_PRESETS } from "@/lib/crm/brand-presets"
import type { IndustryId } from "@/lib/crm/types"
import { cn } from "@/lib/utils"
import { ImageUpload } from "./image-upload"

type Result = { ok: true } | { ok: false; error: string }

export interface AccountActions {
  saveAccount: (input: unknown) => Promise<Result>
  uploadAvatar: (form: FormData) => Promise<Result>
  removeAvatar: () => Promise<Result>
  uploadLogo: (form: FormData) => Promise<Result>
  removeLogo: () => Promise<Result>
  saveBrand: (presetId: string) => Promise<Result>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
}

const secondaryButtonClass =
  "flex items-center justify-center gap-2 rounded-full bg-black/[0.06] px-5 py-3 text-[14px] font-medium text-crm-ink transition-colors hover:bg-black/[0.11] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink"

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[12px] text-crm-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block px-1 text-[11px] text-crm-muted">{hint}</span> : null}
    </label>
  )
}

function Group({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <SectionCard title={title} actions={<span />} className={className}>
      <div className="space-y-5">{children}</div>
    </SectionCard>
  )
}

export function AccountView({
  person,
  business,
  profileHref,
  actions,
}: {
  person: { email: string; fullName: string; jobTitle: string; phone: string; avatarUrl: string | null }
  business: { name: string; logoUrl: string | null; selectedPreset: IndustryId | null; industryPreset: IndustryId; canEdit: boolean }
  profileHref: string
  actions: AccountActions
}) {
  const router = useRouter()
  const toast = useToast()
  const [fullName, setFullName] = useState(person.fullName)
  const [jobTitle, setJobTitle] = useState(person.jobTitle)
  const [phone, setPhone] = useState(person.phone)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()
  const [choosing, setChoosing] = useState<IndustryId | null>(null)
  const [brandError, setBrandError] = useState<string | null>(null)

  const displayName = fullName.trim() || person.email

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    startSaving(async () => {
      try {
        const result = await actions.saveAccount({ fullName, jobTitle, phone })
        if (!result.ok) {
          setError(result.error)
          return
        }
        // Show what was actually stored (spaces collapsed, phone in its canonical form).
        const saved = validateAccount({ fullName, jobTitle, phone })
        if (saved.ok) {
          setFullName(saved.value.fullName)
          setJobTitle(saved.value.jobTitle ?? "")
          setPhone(saved.value.phone ?? "")
        }
        toast("הפרטים נשמרו")
        router.refresh()
      } catch {
        setError("אין חיבור כרגע. נסו שוב.")
      }
    })
  }

  const choosePreset = async (id: IndustryId) => {
    if (choosing || id === business.selectedPreset) return
    setBrandError(null)
    setChoosing(id)
    try {
      const result = await actions.saveBrand(id)
      if (!result.ok) {
        setBrandError(result.error)
        return
      }
      toast("הצבעים עודכנו")
      router.refresh()
    } catch {
      setBrandError("אין חיבור כרגע. נסו שוב.")
    } finally {
      setChoosing(null)
    }
  }

  return (
    <div>
      <PageHeader title="הפרופיל שלי" eyebrow={business.name} />

      <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5">
        <Group title="התמונה והפרטים שלי">
          <ImageUpload
            variant="photo"
            name={displayName}
            imageUrl={person.avatarUrl}
            upload={actions.uploadAvatar}
            remove={actions.removeAvatar}
            hint="תמונה מרובעת עובדת הכי טוב. מקטינים אותה אוטומטית."
          />

          <form onSubmit={submit} className="space-y-3.5">
            <Field label="שם מלא">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={ACCOUNT_LIMITS.fullName} autoComplete="name" required className={fieldClass} />
            </Field>
            <Field label="תפקיד" hint="למשל: בעלת העסק, מנהל סניף">
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={ACCOUNT_LIMITS.jobTitle} autoComplete="organization-title" className={fieldClass} />
            </Field>
            <Field label="טלפון">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="050-000-0000"
                maxLength={30}
                className={cn(fieldClass, "text-end")}
              />
            </Field>
            <Field label="אימייל" hint="זו כתובת ההתחברות, ואי אפשר לשנות אותה כאן.">
              <div className={cn(fieldClass, "cursor-default bg-black/[0.04] text-crm-ink/70")}>
                <bdi dir="ltr">{person.email}</bdi>
              </div>
            </Field>
            {error ? (
              <p role="alert" className="px-1 text-[13px] text-[#b3261e]">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={saving} className={cn(primaryButtonClass, "w-full sm:w-auto sm:px-10")}>
              {saving ? "שומר…" : "שמירה"}
            </button>
          </form>
        </Group>

        <div className="space-y-4 md:space-y-5">
          <Group title="העסק">
            {business.canEdit ? (
              <>
                <ImageUpload
                  variant="logo"
                  name={business.name}
                  imageUrl={business.logoUrl}
                  upload={actions.uploadLogo}
                  remove={actions.removeLogo}
                  hint="מופיע בראש המערכת במקום האות הראשונה של שם העסק."
                />

                <div>
                  <h3 className="mb-2 px-1 text-[13px] font-medium text-crm-ink/70">צבעי המערכת</h3>
                  <div role="radiogroup" aria-label="צבעי המערכת" className="grid grid-cols-3 gap-2.5">
                    {BRAND_PRESETS.map((preset) => {
                      const selected = business.selectedPreset === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={choosing !== null}
                          onClick={() => choosePreset(preset.id)}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-[22px] border p-2.5 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink disabled:opacity-60",
                            selected ? "border-crm-ink bg-white" : "border-black/10 bg-white/60 hover:bg-white",
                          )}
                        >
                          <span
                            aria-hidden
                            className="relative h-10 w-full overflow-hidden rounded-full"
                            style={{ backgroundImage: `linear-gradient(135deg, ${preset.brand.bgFrom}, ${preset.brand.bgTo})` }}
                          >
                            <span className="absolute start-2 top-1/2 size-5 -translate-y-1/2 rounded-full" style={{ background: preset.brand.accent }} />
                            <span className="absolute start-6 top-1/2 size-5 -translate-y-1/2 rounded-full ring-2 ring-white/70" style={{ background: preset.brand.accent2 }} />
                            <span className="absolute end-2 top-1/2 size-3 -translate-y-1/2 rounded-full" style={{ background: preset.brand.warm }} />
                          </span>
                          <span className="font-medium">{preset.label}</span>
                          {preset.id === business.industryPreset ? <span className="-mt-1 text-[10px] text-crm-muted">ברירת מחדל</span> : null}
                          {selected ? (
                            <span aria-hidden className="absolute end-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-crm-ink text-white">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {brandError ? (
                    <p role="alert" className="mt-2 px-1 text-[13px] text-[#b3261e]">
                      {brandError}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-[14px] leading-relaxed text-crm-ink/75">רק בעלי העסק יכולים לשנות את הלוגו והצבעים של {business.name}.</p>
            )}

            <Link href={profileHref} className={cn(secondaryButtonClass, "w-full sm:w-auto")}>
              פרופיל העסק והסוכנים
              <ArrowUpLeft className="size-4" aria-hidden />
            </Link>
          </Group>

          <Group title="אבטחה">
            <p className="text-[14px] leading-relaxed text-crm-ink/75">
              מחוברים כ-<bdi dir="ltr">{person.email}</bdi>. אם נשארתם מחוברים במחשב לא שלכם, אפשר לנתק את כל המכשירים בבת אחת.
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={actions.signOut}>
                <button type="submit" className={secondaryButtonClass}>
                  <LogOut className="size-4" aria-hidden />
                  יציאה מהמכשיר הזה
                </button>
              </form>
              <form action={actions.signOutEverywhere}>
                <button type="submit" className={secondaryButtonClass}>
                  יציאה מכל המכשירים
                </button>
              </form>
            </div>
          </Group>
        </div>
      </div>
    </div>
  )
}
