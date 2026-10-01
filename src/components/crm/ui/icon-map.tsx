import {
  Building2,
  Calendar,
  Camera,
  Dumbbell,
  Gem,
  Hammer,
  Heart,
  House,
  Leaf,
  Mail,
  MapPin,
  Palette,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  Users,
  UtensilsCrossed,
  Wallet,
  Clock,
  type LucideIcon,
} from "lucide-react"

import type { IconKey } from "@/lib/crm/types"

const ICONS: Record<IconKey, LucideIcon> = {
  stethoscope: Stethoscope,
  shield: ShieldCheck,
  calendar: Calendar,
  users: Users,
  "map-pin": MapPin,
  home: House,
  ruler: Ruler,
  wallet: Wallet,
  heart: Heart,
  utensils: UtensilsCrossed,
  leaf: Leaf,
  sparkles: Sparkles,
  clock: Clock,
  tag: Tag,
  camera: Camera,
  dumbbell: Dumbbell,
  hammer: Hammer,
  building: Building2,
  gem: Gem,
  palette: Palette,
  phone: Phone,
  mail: Mail,
}

export function PackIcon({ name, className }: { name: IconKey; className?: string }) {
  const Icon = ICONS[name]
  return <Icon className={className} aria-hidden />
}
