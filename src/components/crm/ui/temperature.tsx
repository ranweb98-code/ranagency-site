import { Flame, Snowflake, Sun, type LucideIcon } from "lucide-react"

import type { Temperature } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

// How warm a lead is has to be readable at a glance in a long list, so it is
// never colour alone: a word, an icon and a hue that differ from each other
// (hot is the only solid one). Shared by the conversation list, the thread and
// the lead status, so "hot" looks the same everywhere.
export const TEMPERATURE: Record<Temperature, { label: string; hint: string; icon: LucideIcon; tag: string; solid: string; edge: string }> = {
  hot: { label: "חם", hint: "מוכן לסגור: כדאי לפנות עכשיו", icon: Flame, tag: "bg-[#d9381a] text-white", solid: "bg-[#d9381a]", edge: "#d9381a" },
  warm: { label: "מתעניין", hint: "שואל ובודק: שווה מעקב", icon: Sun, tag: "bg-[#ffe9b0] text-[#7a4d00]", solid: "bg-[#f0b429]", edge: "#f0b429" },
  cold: { label: "קר", hint: "עוד לא מגלה עניין", icon: Snowflake, tag: "bg-[#dbe8fb] text-[#1d4a8a]", solid: "bg-[#5b8fd9]", edge: "#5b8fd9" },
}

export function TemperatureTag({ temperature, className }: { temperature: Temperature; className?: string }) {
  const { label, icon: Icon, tag } = TEMPERATURE[temperature]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pe-2 ps-1.5 text-[11px] font-semibold leading-4", tag, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  )
}
