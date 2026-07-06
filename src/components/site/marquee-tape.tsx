// Infinite horizontal scrolling tape/ticker, adapted from the "tape-wrapper"
// running text banner in https://codepen.io/aleksa-rakocevic/pen/JoKKjwd (MIT).
// Pure CSS loop: the track renders the item list twice back-to-back and
// scrolls by exactly -50%, so the seam between the two copies is invisible.
// Rotated a couple degrees and overshot horizontally (like the original's
// tape-wrapper) so the tilt never exposes a gap at the section edges.
const TAPE_ITEMS = [
  "בוטים חכמים לוואטסאפ, אינסטגרם ופייסבוק",
  "אוטומציות AI לעסק שלך",
  "אתרים מודרניים שממירים",
  "זמינות 24/7, בלי לפספס אף לקוח",
  "ליווי אישי מהתכנון ועד ההשקה",
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
          className="mx-4 flex items-center gap-4 whitespace-nowrap font-sans text-2xl font-black text-white md:text-3xl"
        >
          {item}
          <span className="text-white/50">✦</span>
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
    <div dir="ltr" className="overflow-hidden py-10 md:py-14">
      <div
        role="marquee"
        aria-label={TAPE_ITEMS.join(" — ")}
        className="-mx-[10%] w-[120%] -rotate-2 bg-gradient-to-l from-ran-primary/80 to-ran-accent/80 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
      >
        <div className="marquee-tape-track flex w-max">
          <TapeContent />
          <TapeContent />
        </div>
      </div>
    </div>
  )
}
