import { Composition } from "remotion"
import { Ad30, type AdProps } from "./Ad30"
import { Ad15, Ad6, CUT_15, CUT_6 } from "./Cutdowns"
import { totalFrames } from "./edit"
import { FPS, HEIGHT, WIDTH } from "./theme"

const defaults: AdProps = { safeZones: false }
const size = { fps: FPS, width: WIDTH, height: HEIGHT, defaultProps: defaults }

export function RemotionRoot() {
  return (
    <>
      <Composition id="Ad30" component={Ad30} durationInFrames={900} {...size} />
      <Composition id="Ad15" component={Ad15} durationInFrames={totalFrames(CUT_15)} {...size} />
      <Composition id="Ad6" component={Ad6} durationInFrames={totalFrames(CUT_6)} {...size} />
    </>
  )
}
