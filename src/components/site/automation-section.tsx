"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from "motion/react"
import {
  Bot,
  Camera,
  Globe,
  MessageCircle,
  Share2,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import { MouseTrail } from "@/components/site/mouse-trail"
import { SectionContainer } from "@/components/site/section-container"

interface Service {
  icon: LucideIcon
  title: string
  description: string
}

const SERVICES: Service[] = [
  {
    icon: MessageCircle,
    title: "בוט וואטסאפ חכם",
    description:
      "בוט אוטומטי שיענה ללקוחות שלך 24/7, יאסוף לידים, יקבע תורים וישלח התראות — הכל בעברית מושלמת",
  },
  {
    icon: Camera,
    title: "בוט אינסטגרם חכם",
    description:
      "הבוט שלנו יענה לכל פנייה באינסטגרם, יאסוף לידים ויגדיל את המכירות שלך — גם כשאתה ישן",
  },
  {
    icon: Bot,
    title: "בוט פייסבוק מסנג'ר",
    description:
      "אוטומציה מלאה לפייסבוק מסנג'ר שתחסוך לך שעות של מענה ידני ותגדיל המרה",
  },
  {
    icon: Globe,
    title: "בניית אתרים מתקדמים",
    description:
      "אתרים מודרניים, יפים וממירים שיעבירו את המסר שלך בצורה מקצועית ויביאו לך יותר לקוחות",
  },
  {
    icon: Workflow,
    title: "אוטומציות עסקיות",
    description: "מחברים בין המערכות שלך ויוצרים תהליכים אוטומטיים שיחסכו לך זמן וכסף",
  },
  {
    icon: Share2,
    title: "ניהול סושיאל מדיה",
    description: "ניהול מלא של הרשתות החברתיות שלך עם תוכן איכותי שנוצר בעזרת AI",
  },
]

// Diagram is drawn in a 0-100 virtual box, then the container's actual
// aspect ratio (square on desktop, portrait/elongated on mobile) stretches
// it — the same polar math reads as a circle on desktop and an ellipse on
// mobile without any extra work.
const RADIUS = 38

function polarPosition(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return { x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) }
}

// Gentle bezier bow, alternating direction per node, so the connectors read
// as flowing arcs instead of a rigid spoke wheel.
function curvedPath(pos: { x: number; y: number }, index: number) {
  const mx = (50 + pos.x) / 2
  const my = (50 + pos.y) / 2
  const dx = pos.x - 50
  const dy = pos.y - 50
  const bow = index % 2 === 0 ? 1 : -1
  const cx = mx + -dy * 0.18 * bow
  const cy = my + dx * 0.18 * bow
  return `M 50 50 Q ${cx} ${cy} ${pos.x} ${pos.y}`
}

// Deterministic pseudo-random particle field — avoids Math.random() during
// render, which would produce a server/client hydration mismatch.
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 23) % 100,
  size: 2 + (i % 3),
  duration: 6 + (i % 5),
  delay: (i % 7) * 0.4,
}))

const DIAGRAM_SIZE = {
  desktop: {
    wrapperClass: "relative mx-auto hidden aspect-square w-full max-w-[460px] md:block",
    hubClass: "h-24 w-24",
    hubTextClass: "text-lg",
    iconClass: "h-16 w-16",
    iconInnerClass: "h-6 w-6",
    labelClass: "max-w-[120px] text-xs",
  },
  mobile: {
    wrapperClass: "relative mx-auto aspect-[3/4] w-full max-w-[360px] md:hidden",
    hubClass: "h-16 w-16",
    hubTextClass: "text-sm",
    iconClass: "h-12 w-12",
    iconInnerClass: "h-5 w-5",
    labelClass: "max-w-[76px] text-[10px]",
  },
} as const

type DiagramVariant = keyof typeof DIAGRAM_SIZE

export function AutomationSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.4"],
  })
  const drawIn = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="automation" className="relative overflow-hidden bg-white pb-16 pt-28 md:pb-20 md:pt-36">
      <MouseTrail />
      <SectionContainer className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* diagram — first in DOM, so it sits on the right in this RTL layout */}
          <div>
            <div ref={sectionRef}>
              <HubDiagram
                variant="mobile"
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                drawIn={drawIn}
              />
              <HubDiagram
                variant="desktop"
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                drawIn={drawIn}
              />
            </div>

            <div className="mx-auto mt-4 min-h-12 max-w-xl text-center">
              <AnimatePresence mode="wait">
                {activeIndex !== null && (
                  <motion.p
                    key={activeIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm leading-relaxed text-ran-text-on-light-muted"
                  >
                    {SERVICES[activeIndex].description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* copy — second in DOM, sits on the left in this RTL layout */}
          <div className="text-center lg:text-right">
            <p className="text-sm font-semibold tracking-wide text-ran-primary">
              מערכת AI אחת, יכולות רבות
            </p>
            <div dir="ltr">
              <h2
                className="mt-3 font-anton uppercase text-ran-text-on-light"
                style={{ fontSize: "var(--text-h2)", letterSpacing: "0.01em", lineHeight: 0.95 }}
              >
                One system. Every channel. Always on.
              </h2>
              <p
                className="mx-auto mt-4 max-w-md text-ran-text-on-light-muted lg:mx-0"
                style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", lineHeight: 1.7 }}
              >
                WhatsApp, Instagram, Facebook &amp; web —
                <br />
                connected and automated around the clock.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

function HubDiagram({
  variant,
  activeIndex,
  setActiveIndex,
  drawIn,
}: {
  variant: DiagramVariant
  activeIndex: number | null
  setActiveIndex: (updater: (current: number | null) => number | null) => void
  drawIn: MotionValue<number>
}) {
  const s = DIAGRAM_SIZE[variant]

  return (
    <div className={s.wrapperClass}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PARTICLES.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-ran-primary/30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -12, 0] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`automation-line-${variant}`} x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="var(--color-ran-primary)" />
            <stop offset="100%" stopColor="var(--color-ran-accent)" />
          </linearGradient>
        </defs>
        {SERVICES.map((service, index) => {
          const pos = polarPosition(index, SERVICES.length)
          const d = curvedPath(pos, index)
          const isActive = activeIndex === index
          return (
            <g key={service.title}>
              <motion.path
                d={d}
                fill="none"
                stroke={`url(#automation-line-${variant})`}
                strokeWidth={isActive ? 0.6 : 0.28}
                strokeLinecap="round"
                opacity={isActive ? 0.9 : 0.4}
                style={{ pathLength: drawIn }}
              />
              <motion.path
                d={d}
                fill="none"
                stroke="var(--color-ran-primary)"
                strokeWidth={0.7}
                strokeDasharray="2 10"
                strokeLinecap="round"
                opacity={isActive ? 0.9 : 0.4}
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              />
            </g>
          )
        })}
      </svg>

      <div
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-[0_0_60px_-8px_var(--color-ran-primary)] ${s.hubClass}`}
      >
        <video
          src="/videos/logo-signature.webm"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain"
        />
      </div>

      {SERVICES.map((service, index) => {
        const pos = polarPosition(index, SERVICES.length)
        const Icon = service.icon
        const isActive = activeIndex === index
        return (
          <button
            key={service.title}
            type="button"
            onMouseEnter={() => setActiveIndex(() => index)}
            onMouseLeave={() => setActiveIndex((current) => (current === index ? null : current))}
            onFocus={() => setActiveIndex(() => index)}
            onClick={() => setActiveIndex((current) => (current === index ? null : index))}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 focus:outline-none"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <motion.span
              animate={{ scale: isActive ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`flex items-center justify-center rounded-2xl border border-ran-glass-border-light bg-white text-ran-primary ${s.iconClass}`}
              style={{
                boxShadow: isActive
                  ? "0 12px 32px -10px rgba(61,107,251,0.45)"
                  : "0 8px 24px -14px rgba(20,20,26,0.2)",
              }}
            >
              <Icon className={s.iconInnerClass} />
            </motion.span>
            <span className={`font-semibold text-ran-text-on-light ${s.labelClass}`}>{service.title}</span>
          </button>
        )
      })}
    </div>
  )
}
