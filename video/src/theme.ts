import { Easing } from "remotion"

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920

/** Meta's Reels safe zones: the top 14% and bottom 35% sit under Instagram's
 *  own UI, so every line of copy lives in the band between them. The lower
 *  part of the band also has the like/comment column on one side. */
export const SAFE = { top: 270, bottom: 1248, side: 65, sideLow: 120 } as const

// The site's monochrome palette (src/app/globals.css).
export const INK = "#111111"
export const WHITE = "#ffffff"
export const SURFACE = "#f5f5f4"
export const MUTED = "#6f6f6f"
export const HAIRLINE = "rgba(17, 17, 17, 0.12)"
export const NIGHT = "#0a0a0a"
export const MORNING = "#343434"
export const ON_DARK = "#f7f7f6"
export const ON_DARK_MUTED = "rgba(247, 247, 246, 0.62)"
export const LIVE = "#10b981"

/** Colour appears only as the signal of a live channel — never as decoration. */
export const CHANNEL = {
  whatsapp: { color: "#16a34a", label: "וואטסאפ" },
  instagram: { color: "#c2185b", label: "אינסטגרם" },
  phone: { color: "#2563eb", label: "טלפון" },
} as const
export type Channel = keyof typeof CHANNEL

/** The site's entrance curve. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1)
/** The liquid curtain's sweep, verbatim from globals.css. */
export const CURTAIN_EASE = Easing.bezier(0.17, 0.67, 0.83, 0.67)

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** 0→1 over `dur` frames starting at `start`, eased with the site's curve. */
export const ease = (f: number, start: number, dur: number) => EASE_OUT(clamp01((f - start) / dur))

/** The founding offer, as on the site: keep in sync with SPOTS_TAKEN in
 *  src/components/site/founding-offer-section.tsx. */
export const FOUNDING = { taken: 6, total: 10 } as const
