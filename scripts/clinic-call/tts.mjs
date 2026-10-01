// Azure TTS for the clinic call. Reads AZURE_SPEECH_KEY / AZURE_SPEECH_REGION
// from the environment — never hard-code the key.
import { writeFileSync, mkdirSync } from "node:fs"
import { LINES, SAMPLE_TEXT, SAMPLE_VOICES } from "./script.mjs"

const key = process.env.AZURE_SPEECH_KEY
const region = process.env.AZURE_SPEECH_REGION
if (!key || !region) throw new Error("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION")

const OUT = new URL("../../public/audio/clinic/", import.meta.url).pathname
mkdirSync(OUT + "samples", { recursive: true })

async function synth(voice, text, rate = "+0%") {
  const lang = voice.startsWith("he-IL") ? "he-IL" : voice.slice(0, 5)
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="he-IL">
<voice name="${voice}"><lang xml:lang="he-IL"><prosody rate="${rate}">${text}</prosody></lang></voice></speak>`
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
      "User-Agent": "napuch-clinic-call",
    },
    body: ssml,
  })
  if (!res.ok) throw new Error(`${voice}: ${res.status} ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

for (const l of LINES) writeFileSync(`${OUT}${l.id}-${l.who}.mp3`, await synth(l.voice, l.text, l.rate))
for (const v of SAMPLE_VOICES) {
  try { writeFileSync(`${OUT}samples/${v}.mp3`, await synth(v, SAMPLE_TEXT)) ; console.log("ok", v) }
  catch (e) { console.log("skip", e.message) }
}
