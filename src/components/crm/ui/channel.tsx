import { Camera, MessageCircle, Phone, type LucideIcon } from "lucide-react"

import type { Channel } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

// Same glyph and colour per channel as the marketing site's agent phones, so a
// client who saw the pitch recognises the same agents inside the product.
export const CHANNELS: Record<Channel, { label: string; icon: LucideIcon; color: string }> = {
  whatsapp: { label: "וואטסאפ", icon: MessageCircle, color: "#16a34a" },
  instagram: { label: "אינסטגרם", icon: Camera, color: "#c2185b" },
  voice: { label: "טלפון", icon: Phone, color: "#334155" },
}

export function ChannelDot({ channel, className }: { channel: Channel; className?: string }) {
  const { icon: Icon, color, label } = CHANNELS[channel]
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-grid size-6 shrink-0 place-items-center rounded-full text-white", className)}
      style={{ backgroundColor: color }}
    >
      <Icon className="size-3.5" aria-hidden />
    </span>
  )
}
