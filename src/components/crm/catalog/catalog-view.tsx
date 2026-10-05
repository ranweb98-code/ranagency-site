"use client"

import { ImageIcon, Images, Layers, Plus, Send, X } from "lucide-react"
import Link from "next/link"
import { useState, type FormEvent } from "react"

import { useToast } from "@/components/crm/shell/toast"
import { Avatar } from "@/components/crm/ui/avatar"
import { fieldClass, primaryButtonClass } from "@/components/crm/ui/field"
import { Glass } from "@/components/crm/ui/glass"
import { IconButton } from "@/components/crm/ui/icon-button"
import { MediaTile } from "@/components/crm/ui/media-tile"
import { Modal } from "@/components/crm/ui/modal"
import { PageHeader } from "@/components/crm/ui/page-header"
import { Pill } from "@/components/crm/ui/pill"
import { StatTile } from "@/components/crm/ui/stat-tile"
import { formatPrice } from "@/lib/crm/format"
import type { CatalogItem, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"

const STATUS: Record<CatalogItem["status"], { label: string; tone: "ink" | "warm" | "soft" | "accent" }> = {
  available: { label: "זמין", tone: "soft" },
  hot: { label: "מבוקש", tone: "warm" },
  reserved: { label: "שמור", tone: "accent" },
  sold: { label: "נמכר", tone: "ink" },
}

export function CatalogView({ data }: { data: CrmData }) {
  const { pack, contacts } = data
  const base = data.basePath
  const toast = useToast()
  const [tag, setTag] = useState("all")
  const [openId, setOpenId] = useState<string | null>(null)
  // Items added in this session only: the demo has nowhere to keep them.
  const [extra, setExtra] = useState<CatalogItem[]>([])
  const [adding, setAdding] = useState(false)
  const catalog = [...data.catalog, ...extra]

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get("title") ?? "").trim().slice(0, 60)
    const price = Number(String(form.get("price") ?? "").replace(/\D/g, ""))
    if (!title) return
    setExtra((list) => [
      ...list,
      { id: `local-${list.length + 1}`, title, subtitle: String(form.get("subtitle") ?? "").trim().slice(0, 80), price, tags: [], meta: [], photos: 0, status: "available", sent: 0 },
    ])
    setAdding(false)
    toast(`${pack.vocab.catalogItem} נוסף. בהדגמה הוא נשמר רק עד לרענון הדף.`)
  }

  const tags = [...new Set(catalog.flatMap((c) => c.tags))]
  const shown = catalog.filter((c) => tag === "all" || c.tags.includes(tag))
  const open = catalog.find((c) => c.id === openId)
  const interested = (id: string) => contacts.filter((c) => c.itemId === id)

  return (
    <div>
      <PageHeader title={pack.vocab.catalog} eyebrow="הסוכנים שולחים את הפריטים האלה ללקוחות בשיחה, עם תמונות ומחיר">
        <StatTile icon={Layers} value={String(catalog.length)} label={`${pack.vocab.catalog}\nבקטלוג`} />
        <StatTile icon={Images} value={String(catalog.reduce((s, c) => s + c.photos, 0))} label={"תמונות שהסוכן\nיכול לשלוח"} />
        <StatTile icon={Send} value={String(catalog.reduce((s, c) => s + c.sent, 0))} label={"שליחות ללקוחות\nעד היום"} badge="אוטומטי" badgeTone="soft" />
      </PageHeader>

      <div role="radiogroup" aria-label="סינון קטלוג" className="crm-hide-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
        {["all", ...tags].map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tag === t}
            onClick={() => setTag(t)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors", tag === t ? "bg-crm-ink text-white" : "crm-glass-soft text-crm-ink/75 hover:bg-white/70")}
          >
            {t === "all" ? "הכול" : t}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {shown.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => setOpenId(item.id)} className="group block w-full text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink">
              <Glass className="overflow-hidden p-2.5 transition-transform duration-300 group-hover:-translate-y-1">
                <MediaTile seed={item.id} icon={pack.catalogIcon} imageUrl={item.photoUrls?.[0]} className="aspect-[4/3] rounded-[22px] md:rounded-[26px]">
                  <Pill tone={STATUS[item.status].tone} className="absolute start-3 top-3 bg-white/85 text-crm-ink">
                    {STATUS[item.status].label}
                  </Pill>
                  {item.photos > 0 ? (
                    <span className="absolute bottom-3 end-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                      <ImageIcon className="size-3.5" aria-hidden />
                      {item.photos} תמונות
                    </span>
                  ) : null}
                </MediaTile>
                <div className="px-2 pb-2 pt-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-medium leading-snug">{item.title}</h2>
                      <p className="mt-0.5 truncate text-xs text-crm-muted">{item.subtitle}</p>
                    </div>
                    <p className="shrink-0 text-[16px] font-semibold tabular-nums">{formatPrice(item.price, item.priceSuffix)}</p>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {[...item.tags, ...item.meta.map((m) => `${m.label}: ${m.value}`)].map((chip) => (
                      <li key={chip} className="rounded-full bg-black/[0.06] px-2.5 py-1 text-[10.5px] text-crm-ink/75">
                        {chip}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-black/[0.06] pt-2.5 text-[11px] text-crm-muted">
                    נשלח ללקוחות {item.sent} פעמים · {interested(item.id).length} מתעניינים עכשיו
                  </p>
                </div>
              </Glass>
            </button>
          </li>
        ))}
        {data.demo ? (
        <li>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="grid h-full min-h-[220px] w-full place-items-center rounded-[34px] border-2 border-dashed border-black/15 p-6 text-center transition-colors hover:border-black/30 hover:bg-white/40"
            >
              <span>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-black/[0.07]">
                  <Plus className="size-5" aria-hidden />
                </span>
                <span className="mt-3 block text-sm font-medium">הוספת {pack.vocab.catalogItem}</span>
                <span className="mt-1 block text-xs text-crm-muted">תמונות, מחיר ופרטים. הסוכן לומד אותם מיד.</span>
              </span>
            </button>
          </li>
        ) : null}
      </ul>

      <Modal open={adding} onClose={() => setAdding(false)} label={`הוספת ${pack.vocab.catalogItem}`} variant="bottom" className="md:!fixed md:!inset-0 md:!m-auto md:!h-fit md:!w-[min(92vw,30rem)]">
        <form onSubmit={addItem} className="crm-panel rounded-t-[32px] p-6 md:rounded-[32px]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-medium">{pack.vocab.catalogItem} חדש</h2>
            <IconButton label="סגירה" size="sm" onClick={() => setAdding(false)}>
              <X />
            </IconButton>
          </div>
          <div className="space-y-3">
            <input name="title" required maxLength={60} autoComplete="off" placeholder="שם" aria-label="שם" className={fieldClass} />
            <input name="subtitle" maxLength={80} autoComplete="off" placeholder="תיאור קצר (לא חובה)" aria-label="תיאור קצר" className={fieldClass} />
            <input name="price" required inputMode="numeric" autoComplete="off" placeholder="מחיר בשקלים" aria-label="מחיר" className={fieldClass} />
          </div>
          <button type="submit" className={`${primaryButtonClass} mt-6 w-full`}>
            הוספה
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(open)} onClose={() => setOpenId(null)} label={open?.title ?? ""} variant="bottom" className="md:!fixed md:!inset-0 md:!m-auto md:!h-fit md:!max-h-[90dvh] md:!w-[min(94vw,46rem)]">
        {open ? (
          <div className="crm-panel max-h-[90dvh] overflow-y-auto rounded-t-[32px] p-4 md:rounded-[32px] md:p-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <Pill tone="soft">{STATUS[open.status].label}</Pill>
              <IconButton label="סגירה" size="sm" onClick={() => setOpenId(null)}>
                <X />
              </IconButton>
            </div>
            <MediaTile seed={open.id} icon={pack.catalogIcon} imageUrl={open.photoUrls?.[0]} className="aspect-[16/9] rounded-[26px]">
              {open.photos > 0 ? (
                <span className="absolute bottom-3 end-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                  <ImageIcon className="size-3.5" aria-hidden />
                  {open.photos} תמונות
                </span>
              ) : null}
            </MediaTile>
            <div className="px-1 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium">{open.title}</h2>
                  <p className="mt-0.5 text-sm text-crm-muted">{open.subtitle}</p>
                </div>
                <p className="text-xl font-semibold tabular-nums">{formatPrice(open.price, open.priceSuffix)}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {open.meta.map((m) => (
                  <div key={m.label} className="rounded-2xl bg-black/[0.05] px-3.5 py-2.5">
                    <dt className="text-[11px] text-crm-muted">{m.label}</dt>
                    <dd className="text-[15px] font-medium">{m.value}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mb-2 mt-5 text-[13px] font-medium">מתעניינים עכשיו ({interested(open.id).length})</h3>
              {interested(open.id).length === 0 ? (
                <p className="rounded-2xl bg-black/[0.05] px-4 py-4 text-sm text-crm-muted">אף אחד לא שאל על זה כרגע.</p>
              ) : (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {interested(open.id).map((c) => (
                    <li key={c.id}>
                      <Link href={`${base}/contacts/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-black/[0.05] px-3 py-2.5 transition-colors hover:bg-black/[0.09]">
                        <Avatar name={c.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</span>
                        <span className="text-[11px] text-crm-muted">{pack.stages.find((s) => s.id === c.stageId)?.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
