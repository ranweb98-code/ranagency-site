"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import type { CrmData } from "@/lib/crm/types"
import { ContactsView } from "./contacts-view"

// See inbox-entry.tsx: `?temp=hot` is applied in the browser so the route
// stays static, with the full list as the Suspense fallback.
function WithParams({ data }: { data: CrmData }) {
  return <ContactsView data={data} initialTemp={useSearchParams().get("temp") ?? undefined} />
}

export function ContactsEntry({ data }: { data: CrmData }) {
  return (
    <Suspense fallback={<ContactsView data={data} />}>
      <WithParams data={data} />
    </Suspense>
  )
}
