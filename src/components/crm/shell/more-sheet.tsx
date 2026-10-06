"use client"

import { ArrowLeftRight, LayoutList, LogOut, Plus, UserRound, X, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { IconButton } from "@/components/crm/ui/icon-button"
import { Modal } from "@/components/crm/ui/modal"

/** Phone-only: the screens that don't fit the four-tab dock. */
export function MoreSheet({
  open,
  onClose,
  nav,
  onAdd,
  signOut,
  adminHref,
  accountHref,
}: {
  open: boolean
  onClose: () => void
  nav: { key: string; href: string; label: string; icon: LucideIcon }[]
  onAdd: () => void
  /** Real workspaces sign out here; the demo links back to the business picker. */
  signOut?: () => Promise<void>
  /** The super admin's way back to the list of businesses (phones have no header link). */
  adminHref?: string
  /** The signed-in person's own profile page. */
  accountHref?: string
}) {
  return (
    <Modal open={open} onClose={onClose} label="עוד" variant="bottom">
      <div className="crm-panel rounded-t-[32px] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">עוד</h2>
          <IconButton label="סגירה" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.key}>
                <Link href={item.href} onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-4 text-sm font-medium">
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li>
            <button type="button" onClick={onAdd} className="flex w-full items-center gap-3 rounded-2xl bg-crm-ink px-4 py-4 text-sm font-medium text-white">
              <Plus className="size-5" aria-hidden />
              ליד חדש
            </button>
          </li>
          {accountHref ? (
            <li>
              <Link href={accountHref} onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-4 text-sm font-medium">
                <UserRound className="size-5" aria-hidden />
                הפרופיל שלי
              </Link>
            </li>
          ) : null}
          {adminHref ? (
            <li>
              <Link href={adminHref} onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-4 text-sm font-medium">
                <LayoutList className="size-5" aria-hidden />
                ניהול עסקים
              </Link>
            </li>
          ) : null}
          <li>
            {signOut ? (
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-4 text-sm font-medium">
                  <LogOut className="size-5" aria-hidden />
                  יציאה
                </button>
              </form>
            ) : (
              <Link href="/crm" onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-black/[0.05] px-4 py-4 text-sm font-medium">
                <ArrowLeftRight className="size-5" aria-hidden />
                החלפת עסק
              </Link>
            )}
          </li>
        </ul>
      </div>
    </Modal>
  )
}
