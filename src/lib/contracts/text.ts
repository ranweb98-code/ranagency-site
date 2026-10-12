// The agreement and privacy policy are plain markdown files in /contracts.
// This module only parses already-loaded text, so the signing page, the PDF
// and the admin screen all read a document exactly the same way.

export interface ParsedDocument {
  version: string
  title: string
  summary: string[]
  /** Text before the first "## " heading. */
  preamble: string[]
  sections: { title: string; paragraphs: string[] }[]
}

function splitFrontMatter(source: string): { meta: Record<string, string | string[]>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return { meta: {}, body: source }

  const meta: Record<string, string | string[]> = {}
  let listKey: string | null = null
  for (const line of match[1].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line)
    if (item && listKey) {
      ;(meta[listKey] as string[]).push(item[1].trim())
      continue
    }
    const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line)
    if (!pair) continue
    if (pair[2] === "") {
      listKey = pair[1]
      meta[listKey] = []
    } else {
      listKey = null
      meta[pair[1]] = pair[2].trim().replace(/^"(.*)"$/, "$1")
    }
  }
  return { meta, body: source.slice(match[0].length) }
}

function paragraphsOf(block: string): string[] {
  return block
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/^>\s?/gm, "").trim())
    .filter(Boolean)
}

export function parseDocument(source: string): ParsedDocument {
  const { meta, body } = splitFrontMatter(source)
  const parts = body.split(/^## +/m)
  return {
    version: typeof meta.version === "string" ? meta.version : "",
    title: typeof meta.title === "string" ? meta.title : "",
    summary: Array.isArray(meta.summary) ? meta.summary : [],
    preamble: paragraphsOf(parts[0]),
    sections: parts.slice(1).map((part) => {
      const [title, ...rest] = part.split(/\r?\n/)
      return { title: title.trim(), paragraphs: paragraphsOf(rest.join("\n")) }
    }),
  }
}

/** Client details and fees are written into the text when the contract is
 *  created, so what is stored (and hashed) is the exact wording the client
 *  sees. Values are flattened to one line so they can never add a heading. */
export function fillPlaceholders(source: string, values: Record<string, string>): string {
  return source.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, key: string) =>
    key in values ? values[key].replace(/\s+/g, " ").trim() : whole,
  )
}

export function formatIls(amount: number): string {
  return amount.toLocaleString("en-US")
}
