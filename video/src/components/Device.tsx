import type { CSSProperties, ReactNode } from "react"
import { HAIRLINE, SURFACE } from "../theme"

export const DEVICE_RATIO = 2.08

/** A phone in the site's device language: thin bezel, soft radius, one
 *  camera pill. Dark for the lock screen at night, light for the chats. */
export function Device({
  width,
  variant,
  children,
  style,
  fade = true,
}: {
  width: number
  variant: "dark" | "light"
  children: ReactNode
  style?: CSSProperties
  /** Dissolve the lower part of the phone into the dark: the eye stays on
   *  the conversation, and the strip Instagram's UI covers stays empty. */
  fade?: boolean
}) {
  const height = Math.round(width * DEVICE_RATIO)
  const radius = Math.round(width * 0.13)
  const bezel = Math.round(width * 0.022)
  const dark = variant === "dark"
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        boxSizing: "border-box",
        borderRadius: radius,
        padding: bezel,
        // On the dark phone the bezel carries a rim light, or it vanishes into the night.
        background: dark
          ? "linear-gradient(160deg, #4a4a4a 0%, #121212 18%, #070707 55%, #262626 100%)"
          : "#ffffff",
        border: dark ? "2px solid rgba(255, 255, 255, 0.10)" : `2px solid ${HAIRLINE}`,
        boxShadow: dark
          ? "0 50px 140px -40px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.06)"
          : "0 70px 160px -60px rgba(0, 0, 0, 0.85), 0 30px 60px -30px rgba(0, 0, 0, 0.5)",
        ...(fade
          ? {
              maskImage: "linear-gradient(to bottom, #000 56%, transparent 93%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 56%, transparent 93%)",
            }
          : null),
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: radius - bezel,
          background: dark ? "#0c0c0c" : SURFACE,
          boxShadow: dark ? "inset 0 0 0 1px rgba(255, 255, 255, 0.05)" : `inset 0 0 0 1px ${HAIRLINE}`,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: Math.round(width * 0.028),
            left: "50%",
            width: Math.round(width * 0.2),
            height: Math.round(width * 0.052),
            transform: "translateX(-50%)",
            borderRadius: 999,
            background: "#000",
          }}
        />
      </div>
    </div>
  )
}
