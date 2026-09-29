/** The lock-screen clock as an odometer: every digit is a vertical strip
 *  positioned by a continuous time value, so rolling from 23:41 to 08:40
 *  (and back, for the rewind) turns the digits over one into the next
 *  instead of cutting between numbers. `t` is minutes since midnight and
 *  may run past 1440 into the next day. */

function positions(t: number) {
  const whole = Math.floor(t)
  const frac = t - whole
  const m = ((whole % 60) + 60) % 60
  const h = ((Math.floor(whole / 60) % 24) + 24) % 24
  const nextH = (h + 1) % 24
  // The hour only turns over during the last minute of the hour.
  const hourCarry = m === 59 ? frac : 0
  return {
    h10: Math.floor(h / 10) + hourCarry * ((Math.floor(nextH / 10) - Math.floor(h / 10) + 3) % 3),
    h1: (h % 10) + hourCarry * (((nextH % 10) - (h % 10) + 10) % 10),
    m10: Math.floor(m / 10) + (m % 10 === 9 ? frac : 0),
    m1: (m % 10) + frac,
  }
}

function Column({ pos, base, size, blur }: { pos: number; base: number; size: number; blur: number }) {
  const cell = size * 1.02
  const wrapped = ((pos % base) + base) % base
  const strip = [...Array.from({ length: base }, (_, i) => i), 0]
  return (
    <div style={{ width: size * 0.6, height: cell, overflow: "hidden" }}>
      <div
        style={{
          transform: `translateY(${-wrapped * cell}px)`,
          filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        }}
      >
        {strip.map((digit, i) => (
          <div key={i} style={{ height: cell, lineHeight: `${cell}px`, textAlign: "center" }}>
            {digit}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Clock({
  t,
  speed = 0,
  size,
  color,
}: {
  t: number
  /** Minutes per frame, for motion blur while the clock is rolling. */
  speed?: number
  size: number
  color: string
}) {
  const p = positions(t)
  const blur = (rate: number) => Math.min(size * 0.05, Math.abs(rate) * size * 0.02)
  return (
    <div
      dir="ltr"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: size,
        fontWeight: 300,
        color,
        letterSpacing: "-0.02em",
      }}
    >
      <Column pos={p.h10} base={3} size={size} blur={blur(speed / 600)} />
      <Column pos={p.h1} base={10} size={size} blur={blur(speed / 60)} />
      <div style={{ width: size * 0.26, textAlign: "center", marginTop: -size * 0.08 }}>:</div>
      <Column pos={p.m10} base={6} size={size} blur={blur(speed / 10)} />
      <Column pos={p.m1} base={10} size={size} blur={blur(speed)} />
    </div>
  )
}
