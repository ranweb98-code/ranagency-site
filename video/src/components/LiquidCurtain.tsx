import type { ReactNode } from "react"
import { AbsoluteFill } from "remotion"
import { FPS, WIDTH } from "../theme"

/** The site's intro curtain (globals.css, .liquid-curtain): a black sheet
 *  whose two edges ripple, crossing the frame right to left. The edge art,
 *  the 7.5s wave loop and the sweep curve are the site's, scaled up for a
 *  1920px-tall frame. `x` is the sheet's offset: WIDTH + EDGE is fully off
 *  to the right, 0 covers the frame, -(WIDTH + EDGE) is gone to the left.
 *  `children` ride on the sheet but hold still against the frame, so the
 *  curtain reveals them as it arrives and wipes them as it leaves. */

const SCALE = 1.6
const TILE = 1080 * SCALE
export const CURTAIN_EDGE = Math.round(165 * SCALE)

const LEADING =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='164.66' height='1080' viewBox='0 0 164.66 1080'%3E%3Ctitle%3EAsset 1%3C/title%3E%3Cpath d='M33.62,1080h131V0h-131A163.35,163.35,0,0,0,20.21,15.76C5.15,36-4,62.18,1.69,86.79,16.36,150.53,114.12,166.52,128.2,230.4c7.94,36-15.13,73.25-8.15,109.45,4.87,25.28,23.59,45.64,32.09,69.94,14,40-1.72,84.84-25.73,119.79s-56,63.86-80.15,98.7-40.32,79.4-26.9,119.63C32.42,787,71.43,816.42,73.84,857.6c1.85,31.71-18.87,65.19-4.74,93.65,14.4,29,66.63,35.73,66.63,68.12C135.73,1045.52,57.55,1053.26,33.62,1080Z' style='fill:%23000000'/%3E%3C/svg%3E"
const TRAILING =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170.82' height='1080' viewBox='0 0 170.82 1080'%3E%3Ctitle%3EAsset 2%3C/title%3E%3Cpath d='M82.5,951.25c-14.13-28.46,6.59-61.94,4.74-93.65C84.83,816.42,45.82,787,32.76,747.91c-13.42-40.23,2.73-84.8,26.91-119.63s56.13-63.74,80.14-98.7,39.74-79.76,25.73-119.79c-8.5-24.3-27.22-44.66-32.09-69.94-7-36.2,16.1-73.44,8.16-109.45C127.52,166.52,29.76,150.53,15.1,86.79,9.44,62.18,18.56,36,33.61,15.76A163.35,163.35,0,0,1,47,0H0V1080H47c23.93-26.74,102.11-34.48,102.11-60.63C149.13,987,96.9,980.26,82.5,951.25Z' style='fill:%23000000'/%3E%3C/svg%3E"

export function LiquidCurtain({
  x,
  frame,
  color = "black",
  children,
}: {
  x: number
  frame: number
  /** The site's curtain is black; the morning in the ad crosses in white. */
  color?: "black" | "white"
  children?: ReactNode
}) {
  const fill = color === "black" ? "#000000" : "#ffffff"
  const tint = (src: string) => (color === "black" ? src : src.replace("fill:%23000000", "fill:%23ffffff"))
  const wave = -((frame / (7.5 * FPS)) % 1) * TILE
  const edge = (src: string) => ({
    position: "absolute" as const,
    top: 0,
    height: "100%",
    backgroundImage: `url("${src}")`,
    backgroundRepeat: "repeat-y",
    backgroundSize: `${CURTAIN_EDGE}px ${TILE}px`,
    backgroundPosition: `0 ${wave}px`,
  })
  return (
    <AbsoluteFill style={{ overflow: "hidden", direction: "ltr" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: "100%", transform: `translateX(${x}px)` }}>
        <div style={{ ...edge(tint(LEADING)), left: -CURTAIN_EDGE + 8, width: CURTAIN_EDGE }} />
        <div style={{ ...edge(tint(TRAILING)), right: -CURTAIN_EDGE - 2, width: CURTAIN_EDGE + 10 }} />
        <div style={{ position: "absolute", inset: 0, background: fill, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, direction: "rtl", transform: `translateX(${-x}px)` }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
