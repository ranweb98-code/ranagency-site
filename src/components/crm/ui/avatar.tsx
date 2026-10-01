import { cn } from "@/lib/utils"

// No photos in the demo, so avatars are initials on a gradient picked from the
// name — stable per person, varied across the list, and the exact slot a real
// profile photo drops into later.
const GRADIENTS = [
  ["#ffb199", "#ff0844"],
  ["#a1c4fd", "#c2e9fb"],
  ["#fbc2eb", "#a6c1ee"],
  ["#fddb92", "#d1fdff"],
  ["#84fab0", "#8fd3f4"],
  ["#f6d365", "#fda085"],
  ["#c3cfe2", "#8ea6d6"],
  ["#d4a5ff", "#7f7fd5"],
] as const

const SIZES = {
  xs: "size-6 text-[9px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-[104px] text-3xl",
} as const

function initials(name: string): string {
  const words = name.replace(/[״"']/g, "").split(/\s+/).filter(Boolean)
  return words.length > 1 ? `${words[0][0]}${words[1][0]}` : (words[0]?.slice(0, 2) ?? "")
}

function gradientFor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

/** `decorative` for avatars inside a control whose own name already says who it is. */
export function Avatar({ name, size = "md", className, decorative }: { name: string; size?: keyof typeof SIZES; className?: string; decorative?: boolean }) {
  const [from, to] = gradientFor(name)
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
      className={cn("inline-grid shrink-0 select-none place-items-center rounded-full font-semibold text-black/70", SIZES[size], className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {decorative ? null : initials(name)}
    </span>
  )
}

export function AvatarStack({ names, max = 3, size = "sm", ring = "ring-white/90" }: { names: string[]; max?: number; size?: keyof typeof SIZES; ring?: string }) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  return (
    <span className="flex items-center [&>*+*]:-ms-2">
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} className={cn("ring-2", ring)} />
      ))}
      {extra > 0 ? (
        <span className={cn("inline-grid place-items-center rounded-full bg-white text-[10px] font-semibold text-crm-ink ring-2", SIZES[size], ring)}>
          +{extra}
        </span>
      ) : null}
    </span>
  )
}
