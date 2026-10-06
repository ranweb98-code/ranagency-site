import { MAX_IMAGE_BYTES } from "./image"
import { squareFit } from "./image-geometry"

// Browser-only: turns whatever the person picked (a 12MB phone photo, a PNG
// logo) into a small square WebP before it is sent anywhere. Doing it here keeps
// the upload tiny and strips the camera metadata (location included).

export type PrepareResult = { ok: true; blob: Blob } | { ok: false; error: string }

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

export async function prepareImage(file: File, mode: "cover" | "contain", max = 512): Promise<PrepareResult> {
  if (!ACCEPTED.includes(file.type)) return { ok: false, error: "בחרו תמונה בפורמט JPG, PNG או WebP" }
  if (file.size > 20_000_000) return { ok: false, error: "הקובץ גדול מדי. בחרו תמונה עד 20MB." }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return { ok: false, error: "לא הצלחנו לקרוא את התמונה. נסו קובץ אחר." }
  }

  const fit = squareFit(bitmap.width, bitmap.height, max, mode)
  const canvas = document.createElement("canvas")
  canvas.width = fit.out
  canvas.height = fit.out
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    return { ok: false, error: "הדפדפן לא מאפשר עיבוד תמונה. נסו דפדפן אחר." }
  }
  context.imageSmoothingQuality = "high"
  context.drawImage(bitmap, fit.sx, fit.sy, fit.sw, fit.sh, fit.dx, fit.dy, fit.dw, fit.dh)
  bitmap.close()

  // WebP first (small, keeps transparency); older Safari silently hands back a
  // PNG, so ask again for a JPEG on a white background rather than send a big file.
  let blob = await toBlob(canvas, "image/webp", 0.86)
  if (blob?.type !== "image/webp") {
    const flat = document.createElement("canvas")
    flat.width = fit.out
    flat.height = fit.out
    const flatContext = flat.getContext("2d")
    if (flatContext) {
      flatContext.fillStyle = "#fff"
      flatContext.fillRect(0, 0, fit.out, fit.out)
      flatContext.drawImage(canvas, 0, 0)
      blob = await toBlob(flat, "image/jpeg", 0.88)
    }
  }

  if (!blob) return { ok: false, error: "לא הצלחנו לעבד את התמונה. נסו קובץ אחר." }
  if (blob.size > MAX_IMAGE_BYTES) return { ok: false, error: "התמונה כבדה מדי גם אחרי הקטנה. נסו תמונה פשוטה יותר." }
  return { ok: true, blob }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}
