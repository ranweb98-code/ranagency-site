import { Config } from "@remotion/cli/config"

// Remotion downloads its own headless Chrome by default. Where that download
// is blocked (the cloud container this was built in), point it at a local
// Chromium instead: REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell
const browser = process.env.REMOTION_BROWSER_EXECUTABLE
if (browser) Config.setBrowserExecutable(browser)

Config.setVideoImageFormat("jpeg")
Config.setJpegQuality(95)
