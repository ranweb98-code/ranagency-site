import { AbsoluteFill } from "remotion"
import { Grain } from "./Grain"

/** The brushed, grainy grey of the monogram artwork (the site's share
 *  image): a cloudy diagonal of light, darker corners, heavy grain. The
 *  `sweep` (0→1) runs one band of light across it for the end card. */
export function MetalSurface({ sweep }: { sweep: number }) {
  const at = -30 + sweep * 160 // % along the diagonal
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(152deg, #6f6f6f 0%, #c9c9c9 20%, #efefef 38%, #d8d8d8 50%, #f4f4f4 62%, #b9b9b9 80%, #2e2e2e 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(55% 22% at 28% 62%, rgba(255, 255, 255, 0.55), transparent 70%), radial-gradient(48% 20% at 74% 34%, rgba(255, 255, 255, 0.5), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(95% 70% at 50% 40%, transparent 48%, rgba(0, 0, 0, 0.45) 100%)" }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(118deg, transparent ${at - 16}%, rgba(255, 255, 255, 0.75) ${at}%, transparent ${at + 16}%)`,
          mixBlendMode: "soft-light",
        }}
      />
      <Grain id="metal-grain" opacity={0.3} baseFrequency={0.72} />
    </AbsoluteFill>
  )
}
