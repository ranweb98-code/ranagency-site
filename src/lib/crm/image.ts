// What an uploaded picture really is, judged by its first bytes rather than by
// what the browser or the file name claims. Pure, so it is unit-tested.

export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" }

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return { mime: "image/png", ext: "png" }
  if (
    bytes.length >= 12 &&
    [0x52, 0x49, 0x46, 0x46].every((b, i) => bytes[i] === b) && // "RIFF"
    [0x57, 0x45, 0x42, 0x50].every((b, i) => bytes[8 + i] === b) // "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" }
  }
  return null
}

export const MAX_IMAGE_BYTES = 500_000
