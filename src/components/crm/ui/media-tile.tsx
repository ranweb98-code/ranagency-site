import type { ReactNode } from "react"

import type { IconKey } from "@/lib/crm/types"
import { cn } from "@/lib/utils"
import { PackIcon } from "./icon-map"

const BASES = ["var(--crm-accent)", "var(--crm-accent-2)"]
const TOPS = ["var(--crm-accent-2)", "var(--crm-warm)", "var(--crm-accent)"]

function seedOf(text: string): number {
  let h = 7
  for (const ch of text) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return h
}

/**
 * Stand-in for a catalog photo. A real `imageUrl` replaces it as soon as the
 * client uploads one; until then the tile is tinted from the tenant's own
 * palette (never a grey box) and carries the pack's icon.
 */
export function MediaTile({
  seed,
  icon,
  imageUrl,
  className,
  children,
}: {
  seed: string
  icon: IconKey
  imageUrl?: string
  className?: string
  children?: ReactNode
}) {
  const n = seedOf(seed)
  // The base is always a deep brand colour so the white glyph stays legible;
  // the lighter brand colours only ever tint the far corner.
  const a = BASES[n % 2]
  const b = TOPS.filter((t) => t !== a)[(n >> 2) % 2]
  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(${120 + (n % 90)}deg, ${a}, ${b})` }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant uploads come from arbitrary storage hosts
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute -end-6 -top-8 size-32 rounded-full bg-white/25 blur-[2px]"
            style={{ transform: `translateX(${(n % 5) * 4}px)` }}
          />
          <span aria-hidden className="absolute -bottom-10 start-4 size-28 rounded-full bg-black/10" />
          <PackIcon name={icon} className="absolute start-1/2 top-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2 text-white/85 drop-shadow-sm rtl:translate-x-1/2" />
        </>
      )}
      {children}
    </div>
  )
}
