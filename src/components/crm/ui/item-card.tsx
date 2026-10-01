import { ImageIcon } from "lucide-react"

import { formatPrice } from "@/lib/crm/format"
import type { CatalogItem, CrmData } from "@/lib/crm/types"
import { cn } from "@/lib/utils"
import { MediaTile } from "./media-tile"

/** The catalog item an agent sent (or a lead is asking about) — photos and all. */
export function ItemCard({ item, icon, compact, label }: { item: CatalogItem; icon?: CrmData["pack"]["catalogIcon"]; compact?: boolean; label?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[20px] bg-white/85 shadow-sm", compact ? "w-[min(260px,100%)]" : "w-full")}>
      {label ? <p className="px-3.5 pt-3 text-[11px] text-crm-muted">{label}</p> : null}
      <div className={label ? "p-2" : undefined}>
        <MediaTile seed={item.id} icon={icon ?? "tag"} className={cn("rounded-[16px]", compact ? "h-28" : "h-32")}>
          {item.photos > 0 ? (
            <span className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white backdrop-blur">
              <ImageIcon className="size-3" aria-hidden />
              {item.photos} תמונות
            </span>
          ) : null}
        </MediaTile>
      </div>
      <div className="px-3.5 pb-3 pt-1.5">
        <p className="text-[13px] font-medium leading-snug">{item.title}</p>
        <p className="mt-0.5 text-[11px] text-crm-muted">{item.subtitle}</p>
        <p className="mt-1.5 text-[14px] font-semibold tabular-nums">{formatPrice(item.price, item.priceSuffix)}</p>
      </div>
    </div>
  )
}
