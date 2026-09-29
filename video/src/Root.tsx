import { Composition } from "remotion"
import { Ad30, type AdProps } from "./Ad30"
import { FPS, HEIGHT, WIDTH } from "./theme"

const defaults: AdProps = { safeZones: false }

export function RemotionRoot() {
  return (
    <Composition
      id="Ad30"
      component={Ad30}
      durationInFrames={900}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaults}
    />
  )
}
