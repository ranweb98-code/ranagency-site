"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import type { CrmData } from "@/lib/crm/types"
import { InboxView } from "./inbox-view"

// `?c=` (open this conversation) is read in the browser so the route itself
// can be prerendered and served from the CDN. The Suspense fallback is the
// complete inbox, so the static HTML is never an empty shell; with a `?c=` it
// swaps to the selected thread once the page hydrates.
function WithParams({ data }: { data: CrmData }) {
  return <InboxView data={data} initialId={useSearchParams().get("c") ?? undefined} />
}

export function InboxEntry({ data }: { data: CrmData }) {
  return (
    <Suspense fallback={<InboxView data={data} />}>
      <WithParams data={data} />
    </Suspense>
  )
}
