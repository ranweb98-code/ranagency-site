import { MAX_IMAGE_BYTES, sniffImage, type ImageKind } from "./image"

/** Judges an uploaded file by its bytes, not by what the browser says it is. */
export async function readImage(form: FormData): Promise<{ ok: true; bytes: Uint8Array; kind: ImageKind } | { ok: false; error: string }> {
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "לא נבחרה תמונה" }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "התמונה גדולה מדי. נסו תמונה קטנה יותר." }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffImage(bytes)
  if (!kind) return { ok: false, error: "הקובץ לא נראה כמו תמונה (JPG, PNG או WebP)" }
  return { ok: true, bytes, kind }
}
