"use client"

import type { ReactNode } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { instagramProfileUrl } from "@/lib/crm/instagram"

/** A link to a lead's Instagram profile. In the demo the usernames are made up
 *  and could belong to a real account, so there it explains itself instead of
 *  opening one — the same rule as the call and WhatsApp buttons. */
export function InstagramLink({ handle, demo, className, label, children }: { handle: string; demo: boolean; className?: string; label: string; children: ReactNode }) {
  const toast = useToast()
  if (demo) {
    return (
      <button type="button" aria-label={label} className={className} onClick={() => toast("בהדגמה שמות המשתמש בדויים ולכן הקישור לא נפתח. בעסק אמיתי הוא פותח את הפרופיל באינסטגרם.")}>
        {children}
      </button>
    )
  }
  return (
    <a href={instagramProfileUrl(handle)} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
      {children}
    </a>
  )
}
