"use client"

import { useSyncExternalStore } from "react"

function subscribe(query: string, callback: () => void) {
  const mediaQueryList = window.matchMedia(query)
  mediaQueryList.addEventListener("change", callback)
  return () => mediaQueryList.removeEventListener("change", callback)
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false
  )
}
