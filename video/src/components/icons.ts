import { Camera, MessageCircle, Phone, type LucideIcon } from "lucide-react"
import type { Channel } from "../theme"

// The site's neutral channel icons — never the platforms' own logos.
export const CHANNEL_ICON: Record<Channel, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  phone: Phone,
}
