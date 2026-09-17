// Infinite horizontal scrolling tape/ticker, adapted from the "tape-wrapper"
// running text banner in https://codepen.io/aleksa-rakocevic/pen/JoKKjwd (MIT).
// Pure CSS loop: the track renders the item list twice back-to-back and
// scrolls by exactly -50%, so the seam between the two copies is invisible.
// Rotated a couple degrees and overshot horizontally (like the original's
// tape-wrapper) so the tilt never exposes a gap at the section edges.
const TAPE_ITEMS = [
  "סוכן וואטסאפ, סוכן אינסטגרם וסוכן קולי",
  "כל ליד מסווג כחם או קר אוטומטית",
  "דשבורד CRM אחד לכל הערוצים",
  "זמינות 24/7, בלי לפספס אף לקוח",
  "קביעת תורים אוטומטית בכל ערוץ",
  "אפס קוד, אפס כאב ראש",
  "תוצאות מדידות מהיום הראשון",
  "יותר לידים, פחות עבודה ידנית",
  "מותאם אישית לעסק שלך",
  "טכנולוגיית AI שמבינה עברית על בוריה",
]

function TapeContent() {
  return (
    <div className="flex shrink-0 items-center">
      {TAPE_ITEMS.map((item, i) => (
        <span
          key={i}
          className="mx-4 flex items-center gap-4 whitespace-nowrap font-sans text-xl font-bold tracking-tight text-ran-text-on-dark md:text-2xl"
        >
          {item}
          <span className="text-ran-text-on-dark-muted">·</span>
        </span>
      ))}
    </div>
  )
}

export function MarqueeTape() {
  return (
    // dir="ltr" wraps the whole subtree (not just the track) — mixing an
    // RTL ancestor with an LTR "too-wide" block caused the overflowing
    // half to land outside the viewport entirely, i.e. the track scrolled
    // through a stretch where nothing was actually on screen.
    <div dir="ltr" className="overflow-hidden">
      <div
        role="marquee"
        aria-label={TAPE_ITEMS.join(" — ")}
        className="bg-ran-surface-dark py-4"
      >
        <div className="marquee-tape-track flex w-max">
          <TapeContent />
          <TapeContent />
        </div>
      </div>
    </div>
  )
}
