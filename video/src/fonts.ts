import { loadFont } from "@remotion/fonts"
import { staticFile } from "remotion"

// Served from public/fonts rather than fetched from Google at render time:
// renders stay identical and work offline. loadFont holds every frame until
// its face is in, so nothing is ever drawn in a fallback font.
// Rubik is the site's typeface; the emoji face is a two-glyph subset of
// Noto Color Emoji (👍 🙂) for the chats. Both are OFL — see public/fonts.
const RUBIK_WEIGHTS = ["300", "400", "500", "700", "800"] as const

for (const weight of RUBIK_WEIGHTS) {
  void loadFont({ family: "Rubik", url: staticFile(`fonts/Rubik-${weight}.ttf`), weight })
}
void loadFont({ family: "Napuch Emoji", url: staticFile("fonts/NotoColorEmoji-chat.ttf") })
// Cousine, a monospace with Hebrew, is the phone-menu terminal of "הקישו 1"
// (Apache 2.0 — see public/fonts/LICENSE-Cousine.txt).
for (const weight of ["400", "700"] as const) {
  void loadFont({ family: "Cousine", url: staticFile(`fonts/Cousine-${weight}.ttf`), weight })
}

export const FONT_STACK = `Rubik, "Napuch Emoji", sans-serif`
export const MONO_STACK = `Cousine, monospace`
