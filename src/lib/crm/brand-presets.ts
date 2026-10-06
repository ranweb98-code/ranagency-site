import { PACKS } from "./industries"
import type { BrandTheme, IndustryId } from "./types"

// The palettes the industry packs already ship with, offered to any business as
// a one-tap look. A choice is stored as plain hex on the business, so it keeps
// working even if a pack's own palette changes later.

const NAMES: Record<IndustryId, string> = {
  generic: "כחול סגול",
  dental: "כחול חשמלי",
  realestate: "כחול רויאל",
  nails: "לבנדר",
  makeup: "ורוד אורכידאה",
  bridal: "אדמה ומרווה",
  chef: "כתום תנור",
  fitness: "אלמוגים",
  contractor: "ענבר וכחול",
}

export interface BrandPreset {
  id: IndustryId
  label: string
  brand: BrandTheme
}

export const BRAND_PRESETS: BrandPreset[] = (Object.keys(NAMES) as IndustryId[]).map((id) => ({ id, label: NAMES[id], brand: PACKS[id].brand }))

export function presetById(id: string): BrandPreset | undefined {
  return BRAND_PRESETS.find((preset) => preset.id === id)
}

const KEYS: (keyof BrandTheme)[] = ["accent", "accent2", "warm", "ink", "bgFrom", "bgTo"]

/** Which preset a brand is exactly equal to (all six colours), if any. */
export function matchPreset(brand: BrandTheme): BrandPreset | undefined {
  return BRAND_PRESETS.find((preset) => KEYS.every((key) => preset.brand[key].toLowerCase() === brand[key].toLowerCase()))
}
