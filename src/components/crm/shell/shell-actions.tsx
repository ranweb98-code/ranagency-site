"use client"

import { createContext, useContext, type ReactNode } from "react"

interface ShellActions {
  openNewLead: () => void
}

const Ctx = createContext<ShellActions | null>(null)

/** Lets any screen inside the shell open the same "new lead" dialog the dock
 *  uses (the empty states do). */
export function ShellActionsProvider({ openNewLead, children }: { openNewLead: () => void; children: ReactNode }) {
  return <Ctx.Provider value={{ openNewLead }}>{children}</Ctx.Provider>
}

export function useShellActions(): ShellActions {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useShellActions must be used inside CrmShell")
  return ctx
}
