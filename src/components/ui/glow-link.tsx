"use client"

import type { ComponentProps } from "react"

import { cn, handleGlareMove } from "@/lib/utils"

/** A solid black call-to-action link with the cursor-tracking shine the site's
 *  other black buttons carry. It exists as its own client component so a server
 *  section can use it: an `onPointerMove` handler can't be passed down from a
 *  server component, but a client component can own it. */
export function GlowLink({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      onPointerMove={handleGlareMove}
      className={cn(
        "cta-glow inline-flex items-center justify-center gap-2 rounded-full bg-ran-text-on-light px-8 py-3 text-sm font-bold text-white transition-transform active:scale-[0.97]",
        className,
      )}
      {...props}
    />
  )
}
