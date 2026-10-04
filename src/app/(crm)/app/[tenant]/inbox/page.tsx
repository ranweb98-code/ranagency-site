import { notFound } from "next/navigation"

import { InboxEntry } from "@/components/crm/inbox/inbox-entry"
import { EmptyWorkspace } from "@/components/crm/live/empty-workspace"
import { getLiveCrmWithThreads } from "@/lib/crm/live"

export const metadata = { title: "שיחות" }

export default async function InboxPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const data = await getLiveCrmWithThreads(tenant)
  if (!data) notFound()

  if (data.contacts.length === 0) {
    return (
      <EmptyWorkspace
        title="שיחות"
        heading="עוד אין שיחות"
        text="כל שיחה שהסוכנים מנהלים בוואטסאפ, באינסטגרם ובטלפון תופיע כאן, עם האפשרות להיכנס ולקחת אותה."
        addLabel={`הוספת ${data.pack.vocab.person}`}
        agentsHref={`${data.basePath}/agents`}
      />
    )
  }
  return <InboxEntry data={data} />
}
