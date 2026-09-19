"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

const CHANNELS = [
  { id: "whatsapp", label: "וואטסאפ" },
  { id: "instagram", label: "אינסטגרם" },
] as const

type ChannelId = (typeof CHANNELS)[number]["id"]

/**
 * The single-channel package works on either channel, so the card lets you
 * pick one rather than naming WhatsApp and leaving Instagram buyers to guess
 * whether it covers them too.
 *
 * Real buttons with `aria-pressed` rather than a styled radio group: there is
 * nothing to submit here, the choice only changes what the card says, and a
 * toggle button is what a screen reader should announce.
 */
export function ChannelChoice() {
  const [channel, setChannel] = useState<ChannelId>("whatsapp")

  return (
    <div className="mt-2">
      <div
        className="inline-flex rounded-full border border-ran-glass-border-light p-0.5"
        role="group"
        aria-label="בחירת ערוץ לסוכן"
      >
        {CHANNELS.map((option) => {
          const isSelected = option.id === channel

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setChannel(option.id)}
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
