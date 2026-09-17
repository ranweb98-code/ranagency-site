"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"

// Schematic flow diagram: N source nodes on the left fan into a processor in
// the middle, which emits a single outcome on the right.
//
// Technique follows the hub diagram this section replaced (quadratic-bezier
// connectors, `pathLength` draw-in gated by useInView, a dashed overlay on the
// same path for the "packets moving down the wire" read). Two things carried
// over that matter:
//   - every gradient/filter id is suffixed with a per-instance `uid`, because
//     three of these render on one page and bare ids collide across SVGs;
//   - the draw plays once on enter rather than being scroll-scrubbed, so the
//     lines don't half-draw and undraw as you scroll past at speed.
//
// Laid out left→right even though the page is RTL. Flow charts read that way
// by convention and the reference this is modelled on — itself a Hebrew RTL
// site — made the same call. Mirroring is a one-line change to `flip`.

const VIEW_W = 360
const VIEW_H = 200

export interface FlowNode {
  /** Small line-art glyph drawn inside the node box, in a 20×20 local box. */
  glyph: "message" | "question" | "calendar" | "phone" | "camera" | "user" | "heart"
  label?: string
}

const GLYPHS: Record<FlowNode["glyph"], React.ReactNode> = {
  message: (
    <>
      <rect x="1" y="3" width="18" height="13" rx="2" />
      <path d="M5 20v-4" />
    </>
  ),
  question: (
    <>
      <circle cx="10" cy="10" r="8" />
      <path d="M7.5 7.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.6" />
      <path d="M10 15h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M2 9h16M6.5 2v4M13.5 2v4" />
    </>
  ),
  phone: <path d="M17 13.5v2.4a1.6 1.6 0 0 1-1.8 1.6 15.4 15.4 0 0 1-6.7-2.4 15 15 0 0 1-4.6-4.6A15.4 15.4 0 0 1 1.5 3.8 1.6 1.6 0 0 1 3.1 2h2.4a1.6 1.6 0 0 1 1.6 1.4c.1.8.3 1.5.5 2.2a1.6 1.6 0 0 1-.4 1.7l-1 1a12 12 0 0 0 4.5 4.5l1-1a1.6 1.6 0 0 1 1.7-.4c.7.3 1.4.4 2.2.5A1.6 1.6 0 0 1 17 13.5z" />,
  camera: (
    <>
      <rect x="1.5" y="1.5" width="17" height="17" rx="4.5" />
      <circle cx="10" cy="10" r="4" />
      <path d="M14.8 5.2h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="6" r="3.5" />
      <path d="M3.5 17.5a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  heart: <path d="M10 17s-6.5-4.2-6.5-8.4A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6.5 2.6C16.5 12.8 10 17 10 17z" />,
}

function Glyph({ kind, x, y }: { kind: FlowNode["glyph"]; x: number; y: number }) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[kind]}
    </g>
  )
}

export function AgentFlowDiagram({
  uid,
  sources,
  processorGlyph,
  processorLabel,
  outcomeLabel,
  sourceLabel,
  accent = "var(--text-strong)",
}: {
  uid: string
  sources: FlowNode[]
  processorGlyph: FlowNode["glyph"]
  processorLabel: string
  outcomeLabel: string
  sourceLabel: string
  /** A touch of colour at the two nodes that carry meaning — the brain and
   *  the win. Source nodes and connectors stay neutral on purpose: colouring
   *  everything is what read as an "AI gradient" in the first place. Falls
   *  back to plain ink so the component still renders sanely without one. */
  accent?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  const shadowId = `flow-shadow-${uid}`
  const glowId = `flow-glow-${uid}`

  // Source column: evenly spaced around the vertical centre.
  const step = 50
  const top = VIEW_H / 2 - ((sources.length - 1) * step) / 2

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-[170px] w-full"
      role="img"
      aria-label={`${sourceLabel} ← ${processorLabel} ← ${outcomeLabel}`}
    >
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
        </filter>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* connectors: sources → processor */}
      {sources.map((_, i) => {
        const y = top + i * step
        const d = `M 82 ${y} Q 118 ${y}, 144 100`
        return (
          <g key={`c${i}`}>
            <motion.path
              d={d}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeOpacity={0.25}
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: [0.65, 0, 0.35, 1] }}
            />
            <motion.path
              d={d}
              fill="none"
              stroke="var(--text-strong)"
              strokeWidth={1.6}
              strokeDasharray="2.5 8"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.8, strokeDashoffset: [0, -22] } : { opacity: 0 }}
              transition={{
                opacity: { duration: 0.3, delay: 0.8 + i * 0.08 },
                strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" },
              }}
            />
          </g>
        )
      })}

      {/* connector: processor → outcome */}
      <motion.path
        d="M 216 100 L 268 100"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={1}
        strokeOpacity={0.25}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.path
        d="M 216 100 L 268 100"
        fill="none"
        stroke="var(--text-strong)"
        strokeWidth={1.6}
        strokeDasharray="2.5 8"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.8, strokeDashoffset: [0, -22] } : { opacity: 0 }}
        transition={{
          opacity: { duration: 0.3, delay: 1.1 },
          strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* source nodes */}
      {sources.map((node, i) => {
        const y = top + i * step
        return (
          <motion.g
            key={`s${i}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.08, ease: "backOut" }}
            style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
          >
            <rect
              x={44}
              y={y - 16}
              width={38}
              height={32}
              rx={5}
              fill="var(--surface-raised)"
              stroke="var(--border-subtle)"
              strokeWidth={1}
              filter={`url(#${shadowId})`}
            />
            <Glyph kind={node.glyph} x={53} y={y - 10} />
          </motion.g>
        )
      })}

      {/* processor */}
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.35, ease: "backOut" }}
        style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
      >
        <rect
          x={140}
          y={56}
          width={80}
          height={88}
          rx={8}
          fill="none"
          stroke={accent}
          strokeWidth={1}
          opacity={0.3}
        />
        <rect
          x={146}
          y={62}
          width={68}
          height={76}
          rx={6}
          fill="var(--surface-raised)"
          stroke={accent}
          strokeWidth={1.4}
          filter={`url(#${glowId})`}
        />
        <g transform="translate(170, 82)" fill="none" stroke="var(--text-strong)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          {GLYPHS[processorGlyph]}
        </g>
        {/* scan line — the only motion inside the box, reads as "working" */}
        <motion.rect
          x={152}
          y={112}
          width={56}
          height={2}
          rx={1}
          fill={accent}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0.15, 0.55, 0.15], scaleX: [0.5, 1, 0.5] } : { opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
        />
      </motion.g>

      {/* outcome */}
      <motion.g
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.45, delay: 0.9, ease: "backOut" }}
        style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
      >
        <motion.circle
          cx={296}
          cy={100}
          r={30}
          fill="none"
          stroke={accent}
          strokeWidth={1}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: [0, 0.28, 0], scale: [0.8, 1.15, 1.3] } : {}}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
          style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
        />
        <circle
          cx={296}
          cy={100}
          r={25}
          fill="var(--surface-raised)"
          stroke={accent}
          strokeWidth={1.4}
          filter={`url(#${shadowId})`}
        />
        <motion.path
          d="M 288 100 l 5.5 5.5 L 305 94"
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.4, delay: 1.15, ease: "easeOut" }}
        />
      </motion.g>

      {/* Labels are Hebrew but the diagram wrapper is dir="ltr" (see the note
          at the top), so any label mixing Hebrew with a Latin run — "פרטים
          ב-CRM" — gets reordered by bidi. Scoping direction back to rtl here
          fixes the reordering without flipping the node layout.
          Tried Secular One here too for a "special" look, but it read wrong
          on real Hebrew copy and got reverted — back to the body's own
          Rubik via plain inheritance. */}
      <g fill="var(--text-muted)" fontSize={10} textAnchor="middle" opacity={0.85} direction="rtl">
        <text x={63} y={188}>{sourceLabel}</text>
        <text x={180} y={188}>{processorLabel}</text>
        <text x={296} y={188}>{outcomeLabel}</text>
      </g>
    </svg>
  )
}
