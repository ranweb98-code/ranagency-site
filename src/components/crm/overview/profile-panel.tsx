"use client"

import { ArrowUpLeft, CalendarPlus, Mail, MessageCircle, Phone, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Avatar } from "@/components/crm/ui/avatar"
import { ChannelDot, CHANNELS } from "@/components/crm/ui/channel"
import { PackIcon } from "@/components/crm/ui/icon-map"
import { IconButton } from "@/components/crm/ui/icon-button"
import { Pill } from "@/components/crm/ui/pill"
import { SectionCard } from "@/components/crm/ui/section-card"
import { Glass } from "@/components/crm/ui/glass"
import { formatMoney, formatRelative } from "@/lib/crm/format"
import type { Contact, CrmData } from "@/lib/crm/types"

const TEMP: Record<Contact["temperature"], { label: string; tone: "warm" | "soft" | "ink" }> = {
  hot: { label: "ליד חם", tone: "warm" },
  warm: { label: "מתעניין", tone: "soft" },
  cold: { label: "קר", tone: "soft" },
}

export function ProfileCard({ contact, data, base }: { contact: Contact; data: CrmData; base: string }) {
  const [starred, setStarred] = useState<Record<string, boolean>>({})
  const stage = data.pack.stages.find((s) => s.id === contact.stageId)
  const isStarred = Boolean(starred[contact.id])

  return (
    <Glass className="relative p-5 text-center">
      <div className="mb-1 flex items-center justify-between">
        <ChannelDot channel={contact.channel} className="size-9 [&_svg]:size-4" />
        <Link href={`${base}/contacts/${contact.id}`} aria-label="פתיחת הכרטיס המלא">
          <IconButton label="פתיחת הכרטיס המלא" tabIndex={-1} className="pointer-events-none">
            <ArrowUpLeft />
          </IconButton>
        </Link>
      </div>
      <div className="mx-auto w-fit rounded-full p-1.5 ring-1 ring-white/70">
        <Avatar name={contact.name} size="xl" className="shadow-lg" />
      </div>
      <h2 className="mt-4 text-[21px] font-medium tracking-tight">{contact.name}</h2>
      <p className="mt-0.5 text-xs text-crm-muted">
        {stage?.label} · {formatMoney(contact.value)}
      </p>
      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        <Pill tone={TEMP[contact.temperature].tone}>{TEMP[contact.temperature].label}</Pill>
        {contact.handledBy === "human" ? <Pill tone="ink">בטיפולך</Pill> : <Pill tone="soft">הסוכן מטפל</Pill>}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Link href={`${base}/inbox?c=${contact.id}`} aria-label="פתיחת השיחה">
          <IconButton label="פתיחת השיחה" tone="glass" tabIndex={-1} className="pointer-events-none"><MessageCircle /></IconButton>
        </Link>
        <a href={`tel:${contact.phone.replace(/-/g, "")}`} aria-label={`התקשרות ל${contact.name}`}>
          <IconButton label="התקשרות" tone="glass" tabIndex={-1} className="pointer-events-none"><Phone /></IconButton>
        </a>
        <a href={`mailto:${contact.email}`} aria-label="שליחת מייל">
          <IconButton label="שליחת מייל" tone="glass" tabIndex={-1} className="pointer-events-none"><Mail /></IconButton>
        </a>
        <Link href={`${base}/calendar`} aria-label="קביעה ביומן">
          <IconButton label="קביעה ביומן" tone="glass" tabIndex={-1} className="pointer-events-none"><CalendarPlus /></IconButton>
        </Link>
        <IconButton
          label={isStarred ? "הסרה ממועדפים" : "הוספה למועדפים"}
          aria-pressed={isStarred}
          tone={isStarred ? "ink" : "glass"}
          onClick={() => setStarred((s) => ({ ...s, [contact.id]: !s[contact.id] }))}
        >
          <Star className={isStarred ? "fill-current" : undefined} />
        </IconButton>
      </div>
    </Glass>
  )
}

export function DetailsCard({ contact, data, base }: { contact: Contact; data: CrmData; base: string }) {
  const rows = [
    { key: "phone", label: "טלפון", value: contact.phone, dir: "ltr" as const, icon: "phone" as const, href: `tel:${contact.phone.replace(/-/g, "")}`, action: "התקשרות" },
    { key: "email", label: "מייל", value: contact.email, dir: "ltr" as const, icon: "mail" as const, href: `mailto:${contact.email}`, action: "שליחת מייל" },
    ...data.pack.fields.map((f) => ({ key: f.key, label: f.label, value: contact.fields[f.key], dir: undefined, icon: f.icon, href: undefined, action: undefined })),
  ]

  return (
    <SectionCard title="פרטים" actions={<Link href={`${base}/contacts/${contact.id}`} className="text-xs font-medium text-crm-ink/70 underline-offset-4 hover:underline">לכרטיס המלא</Link>}>
      <ul className="divide-y divide-black/[0.06]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3 py-2.5">
            <PackIcon name={row.icon} className="size-4 shrink-0 text-crm-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-crm-muted">{row.label}</p>
              <p className="truncate text-[15px] font-medium">{row.dir ? <bdi dir="ltr">{row.value}</bdi> : row.value}</p>
            </div>
            {row.href ? (
              <a href={row.href} aria-label={row.action} className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.06] transition-colors hover:bg-black/10">
                <ArrowUpLeft className="size-4" aria-hidden />
              </a>
            ) : null}
          </li>
        ))}
        <li className="flex items-center gap-3 py-2.5">
          <PackIcon name="users" className="size-4 shrink-0 text-crm-muted" />
          <div className="flex-1">
            <p className="text-[11px] text-crm-muted">מקור</p>
            <div className="mt-1 flex items-center gap-1.5">
              <ChannelDot channel={contact.channel} />
              <span className="text-[15px] font-medium">{CHANNELS[contact.channel].label}</span>
            </div>
          </div>
        </li>
        <li className="flex items-center gap-3 py-2.5">
          <PackIcon name="clock" className="size-4 shrink-0 text-crm-muted" />
          <div className="flex-1">
            <p className="text-[11px] text-crm-muted">קשר אחרון</p>
            <p className="text-[15px] font-medium">{formatRelative(contact.lastContactAt, data.now)}</p>
          </div>
        </li>
      </ul>
    </SectionCard>
  )
}
