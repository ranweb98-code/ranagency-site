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

export const FONT_STACK = `Rubik, "Napuch Emoji", sans-serif`
