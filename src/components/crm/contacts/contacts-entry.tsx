"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import type { CrmData } from "@/lib/crm/types"
import { ContactsView } from "./contacts-view"

// See inbox-entry.tsx: `?temp=hot`, `?stage=` and `?sort=value` are applied in the browser so the route
// stays static, with the full list as the Suspense fallback.
function WithParams({ data }: { data: CrmData }) {
  const params = useSearchParams()
  return <ContactsView data={data} initialTemp={params.get("temp") ?? undefined} initialStage={params.get("stage") ?? undefined} initialSort={params.get("sort") ?? undefined} />
}

export function ContactsEntry({ data }: { data: CrmData }) {
  return (
    <Suspense fallback={<ContactsView data={data} />}>
      <WithParams data={data} />
    </Suspense>
  )
}
