import { PageSkeleton } from "@/components/crm/ui/page-skeleton"

export default function Loading() {
  return (
    <div className="crm-root">
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <PageSkeleton />
      </main>
    </div>
  )
}
