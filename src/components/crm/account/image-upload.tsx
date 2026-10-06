"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ChangeEvent } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { Avatar } from "@/components/crm/ui/avatar"
import { primaryButtonClass } from "@/components/crm/ui/field"
import { prepareImage } from "@/lib/crm/image-client"
import { cn } from "@/lib/utils"

type Result = { ok: true } | { ok: false; error: string }

const secondaryButtonClass =
  "flex items-center justify-center rounded-full bg-black/[0.06] px-6 py-3.5 text-[15px] font-medium text-crm-ink transition-colors hover:bg-black/[0.11] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink disabled:opacity-60"

/** Pick a picture, shrink it in the browser, send it. A face is centre-cropped
 *  into a circle; a logo keeps its whole shape on a white disc. */
export function ImageUpload({
  variant,
  name,
  imageUrl,
  upload,
  remove,
  hint,
}: {
  variant: "photo" | "logo"
  /** Names the picture for screen readers and picks the placeholder initials. */
  name: string
  imageUrl?: string | null
  upload: (form: FormData) => Promise<Result>
  remove: () => Promise<Result>
  hint: string
}) {
  const router = useRouter()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null)
  const [error, setError] = useState<string | null>(null)
  // What the person just chose, shown at once while the server catches up;
  // `""` means "just removed".
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const shown = preview === "" ? null : (preview ?? imageUrl ?? null)

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = "" // so choosing the same file twice still fires
    if (!file) return

    setError(null)
    setBusy("upload")
    try {
      const prepared = await prepareImage(file, variant === "logo" ? "contain" : "cover")
      if (!prepared.ok) {
        setError(prepared.error)
        return
      }
      const form = new FormData()
      form.set("file", new File([prepared.blob], prepared.blob.type === "image/webp" ? "image.webp" : "image.jpg", { type: prepared.blob.type }))
      const result = await upload(form)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPreview(URL.createObjectURL(prepared.blob))
      toast(variant === "logo" ? "הלוגו עודכן" : "התמונה עודכנה")
      router.refresh()
    } catch {
      setError("אין חיבור כרגע. נסו שוב.")
    } finally {
      setBusy(null)
    }
  }

  const onRemove = async () => {
    setError(null)
    setBusy("remove")
    try {
      const result = await remove()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPreview("")
      toast(variant === "logo" ? "הלוגו הוסר" : "התמונה הוסרה")
      router.refresh()
    } catch {
      setError("אין חיבור כרגע. נסו שוב.")
    } finally {
      setBusy(null)
    }
  }

  const label = variant === "logo" ? "לוגו" : "תמונה"

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      {variant === "photo" ? (
        <Avatar name={name} size="xl" src={shown} className="ring-4 ring-white/90" />
      ) : (
        <span role="img" aria-label={name} className="relative grid size-[104px] shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white/90">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- the business's own uploaded logo, from storage
            <img src={shown} alt="" className="size-full object-contain p-2" />
          ) : (
            <span aria-hidden className="text-3xl font-semibold text-crm-ink">
              {name.replace(/[^\p{L}]/gu, "").slice(0, 1)}
            </span>
          )}
        </span>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy !== null} onClick={() => input.current?.click()} className={cn(primaryButtonClass, "py-3")}>
            {busy === "upload" ? "מעלה…" : shown ? `החלפת ${label}` : `העלאת ${label}`}
          </button>
          {shown ? (
            <button type="button" disabled={busy !== null} onClick={onRemove} className={cn(secondaryButtonClass, "py-3")}>
              {busy === "remove" ? "מסיר…" : "הסרה"}
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-[12px] text-crm-muted">{hint}</p>
        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-[#b3261e]">
            {error}
          </p>
        ) : null}
      </div>

      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} tabIndex={-1} aria-hidden className="sr-only" />
    </div>
  )
}
