"use client"

import { ImagePlus, Star, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { areaClass, fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Select } from "@/components/crm/ui/select"
import { CATALOG_LIMITS } from "@/lib/crm/catalog-item"
import { prepareCatalogPhoto } from "@/lib/crm/image-client"
import type { CatalogItem } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

type Result = { ok: true } | { ok: false; error: string }

export interface CatalogActions {
  save: (itemId: string | null, input: unknown) => Promise<{ ok: true; id: string } | { ok: false; error: string }>
  remove: (itemId: string) => Promise<Result>
  addPhoto: (itemId: string, form: FormData) => Promise<Result>
  removePhoto: (itemId: string, path: string) => Promise<Result>
  makeCover: (itemId: string, path: string) => Promise<Result>
}

const STATUS_OPTIONS = [
  { value: "available", label: "זמין" },
  { value: "hot", label: "מבוקש" },
  { value: "reserved", label: "שמור" },
  { value: "sold", label: "נמכר" },
]

interface Staged {
  blob: Blob
  url: string
}

const secondaryClass = "flex items-center justify-center gap-2 rounded-full bg-black/[0.06] px-5 py-3 text-[14px] font-medium text-crm-ink transition-colors hover:bg-black/[0.11] disabled:opacity-60"

/** One form for adding and for editing a catalog item, photos included. A new
 *  item has no id to attach photos to yet, so its photos wait here and go up the
 *  moment it is saved; an existing item uploads each photo as it is picked. */
export function ItemEditor({
  item,
  noun,
  actions,
  onClose,
}: {
  item: CatalogItem | null
  /** What this business calls an item: "שירות", "מנה", "נכס". */
  noun: string
  actions: CatalogActions
  onClose: () => void
}) {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [staged, setStaged] = useState<Staged[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    return () => staged.forEach((s) => URL.revokeObjectURL(s.url))
  }, [staged])

  const saved = (item?.photoUrls ?? []).map((url, i) => ({ url, path: item?.photoPaths?.[i] ?? "" }))
  const photoCount = saved.length + staged.length

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return

    setError(null)
    const room = CATALOG_LIMITS.photos - photoCount
    if (room <= 0) return setError(`אפשר עד ${CATALOG_LIMITS.photos} תמונות לפריט`)
    const chosen = files.slice(0, room)

    for (const [index, file] of chosen.entries()) {
      setBusy(chosen.length > 1 ? `מעלים תמונה ${index + 1} מתוך ${chosen.length}…` : "מעלים תמונה…")
      const prepared = await prepareCatalogPhoto(file)
      if (!prepared.ok) {
        setError(prepared.error)
        break
      }
      if (!item) {
        setStaged((list) => [...list, { blob: prepared.blob, url: URL.createObjectURL(prepared.blob) }])
        continue
      }
      const form = new FormData()
      form.set("file", prepared.blob, "photo")
      const result = await actions.addPhoto(item.id, form)
      if (!result.ok) {
        setError(result.error)
        break
      }
    }
    if (files.length > chosen.length) setError(`אפשר עד ${CATALOG_LIMITS.photos} תמונות לפריט, שאר התמונות לא נוספו`)
    setBusy(null)
  }

  const run = async (label: string, job: () => Promise<Result>) => {
    setError(null)
    setBusy(label)
    const result = await job()
    setBusy(null)
    if (!result.ok) setError(result.error)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    setBusy("שומרים…")
    const result = await actions.save(item?.id ?? null, Object.fromEntries(form))
    if (!result.ok) {
      setBusy(null)
      return setError(result.error)
    }

    let failed = 0
    for (const [index, photo] of staged.entries()) {
      setBusy(`מעלים תמונה ${index + 1} מתוך ${staged.length}…`)
      const upload = new FormData()
      upload.set("file", photo.blob, "photo")
      const uploaded = await actions.addPhoto(result.id, upload)
      if (!uploaded.ok) failed += 1
    }
    setBusy(null)
    toast(failed ? `ה${noun} נשמר, אבל ${failed} תמונות לא עלו. אפשר להוסיף אותן בעריכה.` : `ה${noun} נשמר`)
    onClose()
  }

  const onDelete = async () => {
    if (!item) return
    if (!confirmDelete) return setConfirmDelete(true)
    setBusy("מוחקים…")
    const result = await actions.remove(item.id)
    setBusy(null)
    if (!result.ok) return setError(result.error)
    toast(`ה${noun} נמחק`)
    onClose()
  }

  return (
    <form onSubmit={onSubmit} className="crm-panel max-h-[92dvh] overflow-y-auto rounded-t-[32px] p-5 md:rounded-[32px] md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-medium">{item ? `עריכת ${noun}` : `${noun} חדש`}</h2>
        <IconButton label="סגירה" size="sm" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      {/* ── photos ─────────────────────────────────────────────── */}
      <section aria-label="תמונות">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[13px] font-medium">תמונות</h3>
          <span className="text-[11px] text-crm-muted">{photoCount} מתוך {CATALOG_LIMITS.photos}</span>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {saved.map((photo, index) => (
            <li key={photo.path || photo.url} className="group relative aspect-square overflow-hidden rounded-2xl bg-black/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element -- tenant uploads come from storage */}
              <img src={photo.url} alt="" className="size-full object-cover" />
              {index === 0 ? <span className="absolute start-1.5 top-1.5 rounded-full bg-crm-ink px-2 py-0.5 text-[10px] font-medium text-white">ראשית</span> : null}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                {index !== 0 && item ? (
                  <button type="button" disabled={Boolean(busy)} onClick={() => run("מעדכנים…", () => actions.makeCover(item.id, photo.path))} aria-label="הפיכה לתמונה הראשית" title="הפיכה לתמונה הראשית" className="grid size-7 place-items-center rounded-full bg-white/90 text-crm-ink shadow">
                    <Star className="size-3.5" aria-hidden />
                  </button>
                ) : (
                  <span />
                )}
                {item ? (
                  <button type="button" disabled={Boolean(busy)} onClick={() => run("מוחקים…", () => actions.removePhoto(item.id, photo.path))} aria-label="מחיקת התמונה" title="מחיקת התמונה" className="grid size-7 place-items-center rounded-full bg-white/90 text-[#b3261e] shadow">
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {staged.map((photo, index) => (
            <li key={photo.url} className="relative aspect-square overflow-hidden rounded-2xl bg-black/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file the person just picked */}
              <img src={photo.url} alt="" className="size-full object-cover" />
              {saved.length === 0 && index === 0 ? <span className="absolute start-1.5 top-1.5 rounded-full bg-crm-ink px-2 py-0.5 text-[10px] font-medium text-white">ראשית</span> : null}
              <button type="button" onClick={() => setStaged((list) => list.filter((s) => s !== photo))} aria-label="הסרת התמונה" title="הסרת התמונה" className="absolute bottom-1.5 end-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-[#b3261e] shadow">
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          {photoCount < CATALOG_LIMITS.photos ? (
            <li className={cn(photoCount === 0 && "col-span-full")}>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => input.current?.click()}
                className={cn("grid w-full place-items-center rounded-2xl border-2 border-dashed border-black/20 text-center text-[12px] font-medium text-crm-ink/75 transition-colors hover:border-black/40 hover:bg-white/50 disabled:opacity-60", photoCount === 0 ? "h-28" : "aspect-square")}
              >
                <span className="flex flex-col items-center gap-1.5">
                  <ImagePlus className="size-5" aria-hidden />
                  הוספת תמונות
                </span>
              </button>
            </li>
          ) : null}
        </ul>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPick} className="sr-only" tabIndex={-1} aria-label="בחירת תמונות" />
        <p className="mt-2 text-[11px] leading-relaxed text-crm-muted">
          התמונות מוקטנות אוטומטית. הסוכן שולח אותן ללקוחות בשיחה, והן נגישות לכל מי שמקבל אותן, ולכן אל תעלו תמונות מזהות של לקוחות או מטופלים בלי הסכמה כתובה שלהם.
        </p>
      </section>

      {/* ── details ────────────────────────────────────────────── */}
      <div className="mt-5 space-y-3">
        <input name="title" required maxLength={CATALOG_LIMITS.title} autoComplete="off" defaultValue={item?.title} placeholder="שם" aria-label="שם" className={fieldClass} />
        <textarea name="subtitle" maxLength={CATALOG_LIMITS.subtitle} defaultValue={item?.subtitle} placeholder="תיאור קצר, מה הסוכן יגיד עליו (לא חובה)" aria-label="תיאור קצר" className={areaClass} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <input name="price" inputMode="numeric" autoComplete="off" defaultValue={item && item.price ? String(item.price) : ""} placeholder="מחיר בשקלים" aria-label="מחיר" className={fieldClass} />
          <input name="priceSuffix" maxLength={CATALOG_LIMITS.suffix} autoComplete="off" defaultValue={item?.priceSuffix} placeholder="לדוגמה: לסועד" aria-label="הערה למחיר" className={fieldClass} />
        </div>
        <input name="tags" autoComplete="off" defaultValue={item?.tags.join(", ")} placeholder="קטגוריות, מופרדות בפסיק (לא חובה)" aria-label="קטגוריות" className={fieldClass} />
        <Select name="status" label="סטטוס" defaultValue={item?.status ?? "available"} options={STATUS_OPTIONS} />
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-[#b3261e]/10 px-4 py-2.5 text-[13px] text-[#b3261e]">
          {error}
        </p>
      ) : null}
      {busy ? (
        <p role="status" className="mt-4 text-[13px] text-crm-muted">
          {busy}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={Boolean(busy)} className={cn(primaryButtonClass, "min-w-40 flex-1")}>
          {item ? "שמירה" : `הוספת ${noun}`}
        </button>
        {item ? (
          <button type="button" disabled={Boolean(busy)} onClick={onDelete} className={cn(secondaryClass, confirmDelete && "bg-[#b3261e] text-white hover:bg-[#b3261e]/90")}>
            <Trash2 className="size-4" aria-hidden />
            {confirmDelete ? "לחצו שוב למחיקה" : "מחיקה"}
          </button>
        ) : null}
      </div>
    </form>
  )
}
