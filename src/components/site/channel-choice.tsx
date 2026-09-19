"use client"

import { cn } from "@/lib/utils"

const CHANNELS = [
  { id: "whatsapp", label: "וואטסאפ" },
  { id: "instagram", label: "אינסטגרם" },
] as const

export type ChannelId = (typeof CHANNELS)[number]["id"]

/**
 * The single-channel package runs on either channel at a different price, so
 * the card lets you pick one rather than naming WhatsApp and leaving
 * Instagram buyers to guess whether it covers them.
 *
 * Controlled by the section, which owns the selection because the whole card
 * — price, setup fee and feature list — changes with it, not just this label.
 *
 * Real buttons with `aria-pressed` rather than a styled radio group: there is
 * nothing to submit here, and a toggle button is what a screen reader should
 * announce.
 */
export function ChannelChoice({
  value,
  onChange,
}: {
  value: ChannelId
  onChange: (channel: ChannelId) => void
}) {
  return (
    <div className="mt-2">
      <div
        className="inline-flex rounded-full border border-ran-glass-border-light p-0.5"
        role="group"
        aria-label="בחירת ערוץ לסוכן"
      >
        {CHANNELS.map((option) => {
          const isSelected = option.id === value

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-bold transition-colors",
                isSelected
                  ? "bg-ran-text-on-light text-white"
                  : "text-ran-text-on-light-muted hover:text-ran-text-on-light"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
