// Clinic call → vertical video: captions on white, a hard flash on every cut.
// Needs: ffmpeg, ffprobe, playwright-core (+ Chromium) and @fontsource/rubik.
// Usage: node scripts/clinic-call/render.mjs [out.mp4]
import { execFileSync, spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
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
// Phone rings on white (two rings), then the call is picked up.
const RING = 2.7
cues.push({ t0: 0, t1: RING, text: "מרפאת שיניים", sub: "שיחה נכנסת", kind: "ring" })
t = RING + 0.25

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
  const el = `${AUDIO}eleven/${l.id}.mp3`
  const f = trim(existsSync(el) ? el : `${AUDIO}${l.id}-${l.who}.mp3`, `${l.id}-${l.who}`)
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
tail("אף אחד לא הרים טלפון.", 1.5, "אף אחד")
cues.push({ t0: t, t1: t + 2.6, text: "נפוץ׳", sub: "סוכן קולי שעונה בכל שעה", kind: "end" })
const TOTAL = t + 2.6
// hold each cue until the next begins so there is never a dead white frame mid-talk
for (let i = 0; i < cues.length - 1; i++) if (cues[i + 1].t0 - cues[i].t1 < 0.35) cues[i].t1 = cues[i + 1].t0

// ---- audio mix --------------------------------------------------------
const RINGWAV = `${TMP}/ring.wav`
// 440+480Hz double ring, 20Hz warble, then a soft pickup click
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i",
  `aevalsrc='(sin(2*PI*440*t)+sin(2*PI*480*t))*0.22*(0.6+0.4*sin(2*PI*20*t))*if(lt(mod(t,1.3),0.9),1,0)*if(lt(t,2.5),1,0)+if(between(t,2.5,2.53),0.35*sin(2*PI*1800*t)*(1-(t-2.5)/0.03),0)':d=${RING}:s=48000`, RINGWAV])
audioIn.unshift({ file: RINGWAV, at: 0 })
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
</style><body><div id="bg"></div><div id="stage"><div id="tag"></div><div id="phone" style="display:none;position:relative;width:340px;height:340px;margin-bottom:70px;transform:scale(1.25)"><svg id="waves" viewBox="0 0 340 340" style="position:absolute;inset:0;overflow:visible"><circle id="w1" cx="170" cy="170" r="150" fill="none" stroke="#2563eb" stroke-width="6"/><circle id="w2" cx="170" cy="170" r="150" fill="none" stroke="#2563eb" stroke-width="6"/></svg><svg id="ph" viewBox="0 0 24 24" style="position:absolute;inset:60px;width:220px;height:220px" fill="#2563eb"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg></div><div id="txt"></div><div id="sub"></div></div><div id="brand">נפוץ׳</div><div id="bar"></div></body></html>`

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
  const flash = c.kind === "ring" ? "#fff" : f === 0 ? ACCENT : f === 1 ? "#9db9f5" : f === 2 ? "#eef3ff" : "#fff"
  const p = ease(age / 0.2)
  const big = c.kind === "ring" ? 120 : c.kind === "end" ? 230 : c.kind === "hook" ? (c.text === "22:47" ? 330 : 190) : c.text.length > 20 ? 132 : c.text.length > 12 ? 168 : 214
  let text = c.text
  if (c.hl) text = text.replace(c.hl, `<span style="color:${ACCENT}">${c.hl}</span>`)
  return {
    flash, hidden: c.kind !== "ring" && f < 2, ring: c.kind === "ring" ? age : -1, scale: 1.14 - 0.14 * p, y: (1 - p) * 26, text, big,
    tag: c.kind === "say" ? (c.tag === "agent" ? "הסוכן" : "המטופל") : "",
    tagColor: c.tag === "agent" ? ACCENT : "#6f6f6f",
    sub: c.sub ?? "", end: c.kind === "end" || c.kind === "ring", time: c.kind === "end" ? 1 : 0, prog: time / TOTAL,
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
    const ph = document.getElementById("phone"); ph.style.display = s.ring >= 0 ? "block" : "none"
    if (s.ring >= 0) {
      const a = s.ring, on = a < 2.5 && (a % 1.3) < 0.9
      document.getElementById("ph").style.transform = on ? `rotate(${Math.sin(a * 2 * Math.PI * 9) * 11}deg)` : "rotate(0)"
      ;["w1", "w2"].forEach((id, k) => {
        const el = document.getElementById(id), q = ((a % 1.3) - k * 0.3) / 0.9, v = on && q > 0 && q < 1 ? q : 0
        el.setAttribute("r", String(95 + v * 120)); el.style.opacity = v ? String(0.55 * (1 - v)) : "0"
      })
    }
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
