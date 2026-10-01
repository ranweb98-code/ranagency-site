import { Composition } from "remotion"
import { Ad30, type AdProps } from "./Ad30"
import { Ad15, Ad6, CUT_15, CUT_6 } from "./Cutdowns"
import { FLOOD_FRAMES, Flood } from "./ads/Flood"
import { HOT_OR_COLD_FRAMES, HotOrCold } from "./ads/HotOrCold"
import { PRESS_ONE_FRAMES, PressOne } from "./ads/PressOne"
import { type CallKind, type Voice, Receptionist, receptionistFrames } from "./ads/Receptionist"
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
      <Composition id="PressOne" component={PressOne} durationInFrames={PRESS_ONE_FRAMES} {...size} />
      <Composition
        id="Receptionist"
        component={Receptionist}
        durationInFrames={receptionistFrames("eleven")}
        calculateMetadata={({ props }) => ({ durationInFrames: receptionistFrames(props.voice ?? "eleven", props.call ?? "checkup") })}
        {...size}
        defaultProps={{ safeZones: false, voice: "eleven" as Voice, call: "checkup" as CallKind }}
      />
      <Composition id="HotOrCold" component={HotOrCold} durationInFrames={HOT_OR_COLD_FRAMES} {...size} />
      <Composition id="Flood" component={Flood} durationInFrames={FLOOD_FRAMES} {...size} />
    </>
  )
}
