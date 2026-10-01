/**
 * Numbers carrying a sign or a multiplier ("+11%", "×7.6") flip inside an RTL
 * run — the sign lands on the wrong side. An isolated LTR span keeps them
 * reading the way they are written.
 */
export function Ltr({ children }: { children: React.ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>
}
