// Clinic call → vertical video: captions on white, a hard flash on every cut.
// Needs: ffmpeg, ffprobe, playwright-core (+ Chromium) and @fontsource/rubik.
// Usage: node scripts/clinic-call/render.mjs [out.mp4]
import { execFileSync, spawn, spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { LINES } from "./script.mjs"

const require = createRequire(process.env.RENDER_DEPS ?? import.meta.url)
const { chromium } = require("playwright-core")
const fontDir = require.resolve("@fontsource/rubik/package.json").replace("package.json", "files/")

const AUDIO = new URL("../../public/audio/clinic/", import.meta.url).pathname
const OUT = process.argv[2] ?? new URL("../../public/videos/clinic-call.mp4", import.meta.url).pathname
const W = 1080, H = 1920, FPS = 30
const GAP = 0.32      // breath between speakers
const ACCENT = "#2563eb"

const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString())

// ---- timeline ---------------------------------------------------------
// cue: { t0, t1, text, kind, hl?, tag? }  kind: "hook" | "say" | "end"
const cues = []
let t = 0
const hook = (text, len, hl) => { cues.push({ t0: t, t1: t + len, text, kind: "hook", hl }); t += len }
hook("22:47", 0.9)
hook("המרפאה סגורה.", 1.0)
hook("המטופל עדיין כואב.", 1.15, "כואב")
t += 0.1

const audioIn = [] // {file, at}
const TMP = process.env.RENDER_TMP ?? "/tmp"
// Azure pads every clip with silence. Trim it so a caption lands on the first
// syllable, not on the padding, then use the clip's own pauses as cut points.
function trim(file, name) {
  const out = `${TMP}/${name}.wav`
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-af",
    "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse", out])
  return out
}
function pauses(file) {
  const log = spawnSync("ffmpeg", ["-i", file, "-af", "silencedetect=n=-36dB:d=0.11", "-f", "null", "-"], { encoding: "utf8" }).stderr
  return [...log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => (+m[1] + +m[2]) / 2)
}
for (const l of LINES) {
  const f = trim(`${AUDIO}${l.id}-${l.who}.mp3`, `${l.id}-${l.who}`)
  const d = dur(f)
  audioIn.push({ file: f, at: t })
  // cut points: real pauses when the clip has exactly as many as the captions need
  const want = l.caps.length - 1
  const found = pauses(f).filter((p) => p > 0.15 && p < d - 0.15)
  let cuts
  if (found.length === want) cuts = found
  else {
    const total = l.caps.reduce((n, c) => n + c.length, 0)
    let acc = 0
    cuts = l.caps.slice(0, -1).map((c) => (acc += (c.length / total) * d))
  }
  const edges = [0, ...cuts, d]
  l.caps.forEach((c, i) => cues.push({ t0: t + edges[i], t1: t + edges[i + 1], text: c, kind: "say", tag: l.who }))
  t += d + GAP
}
t += 0.15
const tail = (text, len, hl) => { cues.push({ t0: t, t1: t + len, text, kind: "hook", hl }); t += len }
tail("התור נקבע.", 1.1, "נקבע")
tail("אף אחד לא ענה.", 1.25, "אף אחד")
cues.push({ t0: t, t1: t + 2.6, text: "נפוץ׳", sub: "סוכן קולי שעונה בכל שעה", kind: "end" })
const TOTAL = t + 2.6
// hold each cue until the next begins so there is never a dead white frame mid-talk
for (let i = 0; i < cues.length - 1; i++) if (cues[i + 1].t0 - cues[i].t1 < 0.35) cues[i].t1 = cues[i + 1].t0

// ---- audio mix --------------------------------------------------------
const mixArgs = audioIn.flatMap((a) => ["-i", a.file])
const filt = audioIn.map((a, i) => `[${i}:a]adelay=${Math.round(a.at * 1000)}|${Math.round(a.at * 1000)},volume=1.0[a${i}]`).join(";")
  + `;${audioIn.map((_, i) => `[a${i}]`).join("")}amix=inputs=${audioIn.length}:normalize=0,apad=whole_dur=${TOTAL.toFixed(2)},atrim=0:${TOTAL.toFixed(2)}[m]`
const WAV = OUT.replace(/\.mp4$/, ".wav")
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...mixArgs, "-filter_complex", filt, "-map", "[m]", WAV])

// ---- page -------------------------------------------------------------
const font = (w) => `@font-face{font-family:R;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`${fontDir}rubik-hebrew-${w}-normal.woff2`).toString("base64")})}`
const latin = (w) => `@font-face{font-family:R;font-weight:${w};unicode-range:U+0000-00FF;src:url(data:font/woff2;base64,${readFileSync(`${fontDir}rubik-latin-${w}-normal.woff2`).toString("base64")})}`
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><style>
${[500, 800].map(font).join("")}${[500, 800].map(latin).join("")}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:R,sans-serif;background:#fff;color:#111}
#bg{position:absolute;inset:0}
#stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 90px;text-align:center}
#txt{text-wrap:balance;font-weight:800;line-height:1.08;letter-spacing:-0.03em;will-change:transform}
#tag{font-weight:500;font-size:40px;letter-spacing:.02em;padding:14px 34px;border-radius:999px;margin-bottom:64px;border:3px solid currentColor}
#sub{font-weight:500;font-size:52px;margin-top:44px;color:#6f6f6f}
#brand{position:absolute;bottom:90px;left:0;right:0;text-align:center;font-weight:500;font-size:34px;color:#9a9a9a;letter-spacing:.04em}
#bar{position:absolute;bottom:0;left:0;height:10px;background:${ACCENT}}
</style><body><div id="bg"></div><div id="stage"><div id="tag"></div><div id="txt"></div><div id="sub"></div></div><div id="brand">נפוץ׳</div><div id="bar"></div></body></html>`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" })
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4)
function state(time) {
  const c = cues.find((q) => time >= q.t0 && time < q.t1) ?? cues[cues.length - 1]
  const age = time - c.t0
  const f = Math.floor(age * FPS)
  // two-frame hard flash on every cut: ink-black first, then a half-tone, then white
  const flash = f === 0 ? "#111" : f === 1 ? (c.kind === "say" && c.tag === "agent" ? ACCENT : "#111") : f === 2 ? "#e9e9e9" : "#fff"
  const p = ease(age / 0.2)
  const big = c.kind === "end" ? 230 : c.kind === "hook" ? (c.text === "22:47" ? 330 : 190) : c.text.length > 20 ? 132 : c.text.length > 12 ? 168 : 214
  let text = c.text
  if (c.hl) text = text.replace(c.hl, `<span style="color:${ACCENT}">${c.hl}</span>`)
  return {
    flash, hidden: f < 2, scale: 1.14 - 0.14 * p, y: (1 - p) * 26, text, big,
    tag: c.kind === "say" ? (c.tag === "agent" ? "הסוכן" : "המטופל") : "",
    tagColor: c.tag === "agent" ? ACCENT : "#6f6f6f",
    sub: c.sub ?? "", end: c.kind === "end", time: c.kind === "end" ? 1 : 0, prog: time / TOTAL,
  }
}

const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", WAV,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", OUT], { stdio: ["pipe", "inherit", "inherit"] })

const frames = Math.round(TOTAL * FPS)
for (let i = 0; i < frames; i++) {
  const s = state(i / FPS)
  await page.evaluate((s) => {
    document.getElementById("bg").style.background = s.flash
    const stage = document.getElementById("stage"), txt = document.getElementById("txt"), tag = document.getElementById("tag"), sub = document.getElementById("sub")
    stage.style.opacity = s.hidden ? 0 : 1
    txt.innerHTML = s.text; txt.style.fontSize = s.big + "px"
    txt.style.transform = `translateY(${s.y}px) scale(${s.scale})`
    tag.textContent = s.tag; tag.style.display = s.tag ? "block" : "none"; tag.style.color = s.tagColor
    sub.textContent = s.sub; sub.style.display = s.sub ? "block" : "none"
    document.getElementById("brand").style.display = s.end ? "none" : "block"
    document.getElementById("bar").style.width = (s.prog * 100) + "%"
  }, s)
  const buf = await page.screenshot({ type: "jpeg", quality: 94 })
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r))
}
ff.stdin.end()
await new Promise((r) => ff.on("close", r))
await browser.close()
writeFileSync(OUT.replace(/\.mp4$/, ".cues.json"), JSON.stringify(cues, null, 1))
console.log("done", OUT, TOTAL.toFixed(1) + "s")
