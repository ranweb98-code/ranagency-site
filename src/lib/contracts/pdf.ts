import "server-only"

import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib"

import { visualOrder } from "./bidi"
import { parseDocument } from "./text"

const PAGE = { w: 595.28, h: 841.89 }
const MARGIN = 54
const INK = rgb(0.067, 0.067, 0.067)
const MUTED = rgb(0.435, 0.435, 0.435)
const LINE = rgb(0.85, 0.85, 0.84)

interface FaceSet {
  he: PDFFont
  latin: PDFFont
}

async function loadFonts(pdf: PDFDocument): Promise<{ regular: FaceSet; bold: FaceSet }> {
  pdf.registerFontkit(fontkit)
  const dir = path.join(process.cwd(), "assets", "fonts")
  const embed = async (file: string) => pdf.embedFont(await readFile(path.join(dir, file)), { subset: true })
  return {
    regular: { he: await embed("heebo-hebrew-400-normal.woff"), latin: await embed("heebo-latin-400-normal.woff") },
    bold: { he: await embed("heebo-hebrew-700-normal.woff"), latin: await embed("heebo-latin-700-normal.woff") },
  }
}

function normalise(text: string): string {
  return text
    .replace(/[‎‏‪-‮]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₪/g, 'ש"ח')
}

function fontFor(faces: FaceSet, ch: string): PDFFont {
  const code = ch.codePointAt(0)!
  if (code >= 0x0590 && code <= 0x05ff) return faces.he
  if (faces.latin.getCharacterSet().includes(code)) return faces.latin
  return faces.he.getCharacterSet().includes(code) ? faces.he : faces.latin
}

function supported(faces: FaceSet, ch: string): string {
  const code = ch.codePointAt(0)!
  return faces.latin.getCharacterSet().includes(code) || faces.he.getCharacterSet().includes(code) ? ch : "?"
}

function widthOf(faces: FaceSet, text: string, size: number): number {
  let total = 0
  for (const ch of Array.from(text)) total += fontFor(faces, ch).widthOfTextAtSize(ch, size)
  return total
}

/** Greedy wrap in logical order, so each line can then be reordered on its own. */
function wrap(faces: FaceSet, text: string, size: number, maxWidth: number): string[] {
  const words = normalise(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || widthOf(faces, candidate, size) <= maxWidth) current = candidate
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Draws one logical line right-aligned at x = right. */
function drawLine(page: PDFPage, faces: FaceSet, line: string, right: number, y: number, size: number, color = INK) {
  const visual = visualOrder(normalise(line)).map((ch) => supported(faces, ch))
  const total = widthOf(faces, visual.join(""), size)
  let x = right - total
  // draw in runs that share a font, left to right
  let run = ""
  let runFont: PDFFont | null = null
  const flush = () => {
    if (run && runFont) {
      // fontkit lays a run of Hebrew letters out right to left on its own, so a
      // Hebrew run is handed over in reading order; the line order is already
      // visual. (Verified against Chromium's rendering of the same text.)
      const text = runFont === faces.he ? Array.from(run).reverse().join("") : run
      page.drawText(text, { x, y, size, font: runFont, color })
      x += runFont.widthOfTextAtSize(run, size)
    }
    run = ""
  }
  for (const ch of visual) {
    const font = fontFor(faces, ch)
    if (font !== runFont) {
      flush()
      runFont = font
    }
    run += ch
  }
  flush()
}

export interface SignedPdfInput {
  agreementText: string
  agreementSha256: string
  agreementVersion: string
  businessName: string
  contactName: string
  taxId: string
  typedName: string
  signedAtIso: string
  ip: string
  signaturePng: Buffer
}

function stamp(iso: string): { il: string; utc: string } {
  const date = new Date(iso)
  const il = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Jerusalem" }).format(date)
  return { il, utc: date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC") }
}

export async function buildSignedPdf(input: SignedPdfInput): Promise<{ bytes: Buffer; sha256: string }> {
  const pdf = await PDFDocument.create()
  pdf.setTitle("Service agreement - Napuch AI")
  pdf.setProducer("Napuch AI")
  const { regular, bold } = await loadFonts(pdf)
  const doc = parseDocument(input.agreementText)
  const right = PAGE.w - MARGIN
  const textWidth = PAGE.w - MARGIN * 2

  let page = pdf.addPage([PAGE.w, PAGE.h])
  let y = PAGE.h - MARGIN

  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 28) {
      page = pdf.addPage([PAGE.w, PAGE.h])
      y = PAGE.h - MARGIN
    }
  }
  const paragraph = (text: string, size = 10.5, faces = regular, gap = 6, color = INK) => {
    for (const line of wrap(faces, text, size, textWidth)) {
      ensure(size * 1.7)
      y -= size * 1.7
      drawLine(page, faces, line, right, y, size, color)
    }
    y -= gap
  }

  paragraph(doc.title || "הסכם שירות", 20, bold, 4)
  paragraph(`${input.businessName}  |  גרסה ${input.agreementVersion}`, 10, regular, 14, MUTED)
  page.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: right, y: y + 6 }, thickness: 0.6, color: LINE })
  y -= 10

  for (const p of doc.preamble) paragraph(p)
  for (const section of doc.sections) {
    y -= 6
    ensure(40)
    paragraph(section.title, 12.5, bold, 3)
    for (const p of section.paragraphs) paragraph(p)
  }

  // Signature block, kept together on one page.
  const times = stamp(input.signedAtIso)
  ensure(250)
  y -= 14
  page.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: right, y: y + 6 }, thickness: 0.6, color: LINE })
  y -= 14
  paragraph("חתימה דיגיטלית", 13, bold, 6)
  paragraph(`נחתם על ידי: ${input.typedName} (${input.contactName}), ${input.businessName}, ח.פ./ת.ז. ${input.taxId}`, 10.5)

  const image: PDFImage = await pdf.embedPng(input.signaturePng)
  const maxW = 220
  const maxH = 90
  const scale = Math.min(maxW / image.width, maxH / image.height, 1)
  const w = image.width * scale
  const h = image.height * scale
  y -= 14
  ensure(h + 30)
  page.drawRectangle({ x: right - w - 8, y: y - h - 8, width: w + 16, height: h + 16, borderColor: LINE, borderWidth: 0.8 })
  page.drawImage(image, { x: right - w, y: y - h, width: w, height: h })
  y -= h + 26

  paragraph(`תאריך ושעה (ישראל): ${times.il}`, 10, regular, 2, MUTED)
  paragraph(`תאריך ושעה (UTC): ${times.utc}`, 10, regular, 2, MUTED)
  paragraph(`כתובת IP: ${input.ip}`, 10, regular, 2, MUTED)
  paragraph("הזהות אומתה באמצעות קוד חד-פעמי שנשלח לכתובת המייל שצוינה בהסכם.", 10, regular, 2, MUTED)

  // Footer on every page: the hash of the agreement text and the page number.
  const pages = pdf.getPages()
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN + 18 }, end: { x: right, y: MARGIN + 18 }, thickness: 0.4, color: LINE })
    p.drawText(`SHA-256: ${input.agreementSha256}`, { x: MARGIN, y: MARGIN + 6, size: 6.5, font: regular.latin, color: MUTED })
    drawLine(p, regular, `עמוד ${index + 1} מתוך ${pages.length}`, right, MARGIN - 6, 8, MUTED)
    drawLine(p, regular, "hash של נוסח ההסכם:", right, MARGIN + 6, 7, MUTED)
  })

  const bytes = Buffer.from(await pdf.save())
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") }
}
