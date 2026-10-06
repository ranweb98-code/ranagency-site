// Where a picked photo lands on the square we upload. Pure maths, kept apart
// from the canvas code so it can be tested without a browser.

export interface SquareFit {
  /** Side of the square to export, in px. */
  out: number
  /** Source rectangle to read. */
  sx: number
  sy: number
  sw: number
  sh: number
  /** Destination rectangle on the square. */
  dx: number
  dy: number
  dw: number
  dh: number
}

/** `cover` crops the centre (a face); `contain` keeps the whole picture (a logo)
 *  and leaves the rest transparent. Never upscales past the source. */
export function squareFit(width: number, height: number, max: number, mode: "cover" | "contain"): SquareFit {
  const side = mode === "cover" ? Math.min(width, height) : Math.max(width, height)
  const out = Math.max(1, Math.min(max, Math.round(side)))

  if (mode === "cover") {
    return { out, sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), sw: side, sh: side, dx: 0, dy: 0, dw: out, dh: out }
  }

  const scale = out / side
  const dw = Math.max(1, Math.round(width * scale))
  const dh = Math.max(1, Math.round(height * scale))
  return { out, sx: 0, sy: 0, sw: width, sh: height, dx: Math.round((out - dw) / 2), dy: Math.round((out - dh) / 2), dw, dh }
}
