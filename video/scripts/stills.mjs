// Render a handful of frames of one composition to JPEGs, bundling once.
// usage: node scripts/stills.mjs <composition> <outDir> <frame> [<frame> ...]
import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"
import path from "node:path"

const [id, outDir, ...frames] = process.argv.slice(2)
const inputProps = JSON.parse(process.env.PROPS ?? "{}") // e.g. PROPS='{"voice":"azure"}'
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") })
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null
const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable })
for (const frame of frames.map(Number)) {
  const output = path.join(outDir, `${id}-${String(frame).padStart(4, "0")}.jpg`)
  await renderStill({ serveUrl, composition, inputProps, frame, output, imageFormat: "jpeg", jpegQuality: 85, browserExecutable })
  console.log(output)
}
