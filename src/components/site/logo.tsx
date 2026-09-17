import { cn } from "@/lib/utils"

// The NAPUTZ' wordmark — "נפוץ'" set in a bold geometric slant, supplied as
// artwork rather than live text because the typeface isn't a webfont we have.
// Extracted to a transparent PNG with near-black ink (#111, matching
// --text-strong), so it sits on the page surface with no plate behind it.
const WORDMARK_SRC = "/images/napuch-wordmark.png"
// Intrinsic ratio of the exported art (1000×432).
const ASPECT = 1000 / 432

export function Logo({
  className,
  height = 24,
  /** Flip the near-black ink to near-white, for the dark footer band. */
  onDark = false,
}: {
  className?: string
  height?: number
  onDark?: boolean
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand mark; next/image's srcset machinery buys nothing at this size
    <img
      src={WORDMARK_SRC}
      alt="נפוץ'"
      width={Math.round(height * ASPECT)}
      height={height}
      className={cn("shrink-0 select-none object-contain", className)}
      style={{
        height,
        width: Math.round(height * ASPECT),
        // The art is a single flat ink colour, so a plain invert is exact
        // here — no hue to distort, unlike inverting a photo or a gradient.
        filter: onDark ? "invert(1)" : undefined,
      }}
    />
  )
}
