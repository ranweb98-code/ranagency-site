import { notFound } from "next/navigation"

import { EmptyWorkspace } from "@/components/crm/live/empty-workspace"
import { OverviewView } from "@/components/crm/overview/overview-view"
import { getLiveCrmWithMetrics } from "@/lib/crm/live"

export default async function OverviewPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const result = await getLiveCrmWithMetrics(tenant)
  if (!result) notFound()
  const { data, metrics } = result

  if (data.contacts.length === 0) {
    return (
      <EmptyWorkspace
        title="סקירה"
        eyebrow={`${data.tenant.businessName} · ${data.pack.label}`}
        heading={`עוד אין ${data.pack.vocab.people} כאן`}
        text="ברגע שהסוכנים יתחילו לענות, הפניות, השיחות וההכנסות יופיעו כאן לבד. עד אז אפשר להוסיף ידנית את הראשונה."
        addLabel={`הוספת ${data.pack.vocab.person}`}
        agentsHref={`${data.basePath}/agents`}
      />
    )
  }
  return <OverviewView data={data} metrics={metrics} />
}
