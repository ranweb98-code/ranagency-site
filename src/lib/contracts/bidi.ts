// A small right-to-left layout step for the PDF. pdf-lib draws glyphs in the
// order it is given and knows nothing about Hebrew, so each line is reordered
// into visual order here first. It follows the core of the Unicode
// bidirectional algorithm for a right-to-left paragraph: Hebrew is level 1;
// Latin letters and numbers are level 2 (read left to right, placed right to
// left); neutrals (spaces, punctuation) between two runs take the paragraph
// direction unless both sides are Latin.

type Kind = "R" | "L" | "N"

const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "«": "»", "»": "«" }

function kindOf(ch: string): Kind {
  const c = ch.codePointAt(0)!
  if ((c >= 0x0590 && c <= 0x05ff) || (c >= 0xfb1d && c <= 0xfb4f)) return "R"
  if (/[A-Za-z0-9]/.test(ch)) return "L"
  return "N"
}

/** Characters in visual order (left to right) for a line of RTL text. */
export function visualOrder(line: string): string[] {
  const chars = Array.from(line)
  const kinds = chars.map(kindOf)

  // One separator between two digits belongs to the number: 1,500  12/10  3.5
  for (let i = 1; i < chars.length - 1; i++) {
    if (kinds[i] === "N" && /[.,:/\-]/.test(chars[i]) && /\d/.test(chars[i - 1]) && /\d/.test(chars[i + 1])) kinds[i] = "L"
  }

  // Neutrals: between two Latin/number runs they stay with them (e.g. a dot in
  // a domain, a space inside an English phrase only when it is a single
  // space between Latin words); otherwise they follow the paragraph (RTL).
  const resolved: Kind[] = kinds.slice()
  let i = 0
  while (i < chars.length) {
    if (kinds[i] !== "N") {
      i++
      continue
    }
    let j = i
    while (j < chars.length && kinds[j] === "N") j++
    const before = i > 0 ? kinds[i - 1] : "R"
    const after = j < chars.length ? kinds[j] : "R"
    const run = chars.slice(i, j).join("")
    const joinsLatin = before === "L" && after === "L" && /^[ .\-_/:@']{1}$/.test(run) && run !== " "
    for (let k = i; k < j; k++) resolved[k] = joinsLatin ? "L" : "R"
    i = j
  }

  const levels = resolved.map((k) => (k === "R" ? 1 : 2))
  const order = chars.map((_, index) => index)

  // L2: from the highest level down to the lowest odd level, reverse every run.
  for (let level = 2; level >= 1; level--) {
    let start = -1
    for (let idx = 0; idx <= order.length; idx++) {
      const inRun = idx < order.length && levels[order[idx]] >= level
      if (inRun && start === -1) start = idx
      if (!inRun && start !== -1) {
        const slice = order.slice(start, idx).reverse()
        order.splice(start, slice.length, ...slice)
        start = -1
      }
    }
  }

  return order.map((index) => {
    const ch = chars[index]
    return levels[index] === 1 && MIRROR[ch] ? MIRROR[ch] : ch
  })
}
