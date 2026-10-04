import { Glass } from "./glass"

/** What a screen shows the instant it is clicked, while the server fetches its
 *  data: the same page header and card shapes, so the shell stays put and the
 *  content fills in rather than the whole page appearing to freeze. */
export function PageSkeleton() {
  const bar = "animate-pulse rounded-full bg-black/[0.08]"
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">טוען…</span>
      <div className="flex flex-col gap-5 pb-5 pt-1 md:flex-row md:items-center md:justify-between md:gap-8 md:pb-7">
        <div>
          <div className={`${bar} mb-3 h-3 w-40`} />
          <div className={`${bar} h-10 w-56 md:h-12 md:w-72`} />
        </div>
        <div className="flex gap-6 md:gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${bar} h-12 w-12`} />
              <div className={`${bar} h-8 w-14`} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
        <Glass className="min-h-64 p-5 lg:col-span-8">
          <div className={`${bar} h-4 w-32`} />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[26px] bg-black/[0.06]" />
            ))}
          </div>
        </Glass>
        <Glass className="min-h-64 p-5 lg:col-span-4">
          <div className="mx-auto mt-2 size-20 animate-pulse rounded-full bg-black/[0.08]" />
          <div className={`${bar} mx-auto mt-5 h-5 w-32`} />
          <div className={`${bar} mx-auto mt-3 h-3 w-24`} />
        </Glass>
        <Glass className="min-h-48 p-5 lg:col-span-6">
          <div className={`${bar} h-4 w-28`} />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-full bg-black/[0.06]" />
            ))}
          </div>
        </Glass>
        <Glass className="min-h-48 p-5 lg:col-span-6">
          <div className={`${bar} h-4 w-28`} />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-full bg-black/[0.06]" />
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}
