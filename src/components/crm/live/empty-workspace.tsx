"use client"

import { Inbox, Plus } from "lucide-react"
import Link from "next/link"

import { useShellActions } from "@/components/crm/shell/shell-actions"
import { Glass } from "@/components/crm/ui/glass"
import { PageHeader } from "@/components/crm/ui/page-header"

/** What a brand-new business sees before its first lead: a clear next step
 *  instead of charts of zeros. */
export function EmptyWorkspace({
  title,
  eyebrow,
  heading,
  text,
  addLabel,
  agentsHref,
}: {
  title: string
  eyebrow?: string
  heading: string
  text: string
  /** Offer the "new lead" dialog under this label. */
  addLabel?: string
  agentsHref?: string
}) {
  const { openNewLead } = useShellActions()

  return (
    <div>
      <PageHeader title={title} eyebrow={eyebrow} />
      <Glass className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center md:py-16">
        <span className="mb-5 grid size-14 place-items-center rounded-full bg-crm-ink text-white">
          <Inbox className="size-6" aria-hidden />
        </span>
        <h2 className="text-[22px] font-medium leading-tight tracking-tight">{heading}</h2>
        <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-crm-ink/70">{text}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {addLabel ? (
            <button
              type="button"
              onClick={openNewLead}
              className="flex items-center gap-2 rounded-full bg-crm-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {addLabel}
            </button>
          ) : null}
          {agentsHref ? (
            <Link href={agentsHref} className="rounded-full bg-black/[0.07] px-6 py-3 text-sm font-medium transition-colors hover:bg-black/[0.11]">
              מצב חיבור הסוכנים
            </Link>
          ) : null}
        </div>
      </Glass>
    </div>
  )
}
