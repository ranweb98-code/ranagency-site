"use client"

import { Maximize2, X } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Glass } from "./glass"
import { IconButton } from "./icon-button"
import { PopoverMenu, type MenuItem } from "./menu"
import { Modal } from "./modal"

/** A glass card with the title row used all over the dashboard. Unless the
 *  caller supplies its own `actions`, the header offers two working controls:
 *  expand (the same card, large, in a dialog) and — when the card has related
 *  screens to point at — a "more" menu of links to them. */
export function SectionCard({
  title,
  actions,
  menu,
  className,
  bodyClassName,
  children,
}: {
  title: string
  /** Replaces the default expand + menu pair. */
  actions?: ReactNode
  /** Links offered under the "more" menu; leave out to show only the expand control. */
  menu?: MenuItem[]
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Glass className={cn("flex flex-col p-4 md:p-5", className)}>
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-medium">{title}</h2>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              {menu?.length ? <PopoverMenu items={menu} /> : null}
              <IconButton label="הרחבה" size="sm" aria-haspopup="dialog" onClick={() => setExpanded(true)}>
                <Maximize2 />
              </IconButton>
            </>
          )}
        </div>
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>

      {actions === undefined ? (
        <Modal open={expanded} onClose={() => setExpanded(false)} label={title} className="!w-[min(94vw,60rem)]">
          <div className="crm-panel max-h-[90dvh] overflow-y-auto rounded-[32px] p-5 md:p-6">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{title}</h2>
              <IconButton label="סגירה" size="sm" onClick={() => setExpanded(false)}>
                <X />
              </IconButton>
            </header>
            {children}
          </div>
        </Modal>
      ) : null}
    </Glass>
  )
}
