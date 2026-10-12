"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataUrl: () => string
  /** Accessible alternative to drawing: writes the typed name onto the pad. */
  drawText: (text: string) => void
}

const HEIGHT = 180

/** A drawing surface that works with a finger, a stylus or a mouse. */
export const SignaturePad = forwardRef<SignaturePadHandle, { onChange?: (empty: boolean) => void; invalid?: boolean; describedBy?: string }>(
  function SignaturePad({ onChange, invalid, describedBy }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const last = useRef<{ x: number; y: number } | null>(null)
    const ink = useRef(0)
    const [empty, setEmpty] = useState(true)

    // Sizes the drawing buffer to the screen and wipes it. Touches no React state,
    // so it can run from an effect.
    const resetCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const width = canvas.clientWidth
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(HEIGHT * ratio)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2.6
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#111111"
      ink.current = 0
    }, [])

    const setup = useCallback(() => {
      resetCanvas()
      setEmpty(true)
      onChange?.(true)
    }, [resetCanvas, onChange])

    useEffect(() => {
      resetCanvas()
      let width = canvasRef.current?.clientWidth ?? 0
      const onResize = () => {
        // Only a change of width redraws (the mobile address bar changes height while scrolling).
        const next = canvasRef.current?.clientWidth ?? 0
        if (next !== width) {
          width = next
          setup()
        }
      }
      window.addEventListener("resize", onResize)
      return () => window.removeEventListener("resize", onResize)
    }, [resetCanvas, setup])

    const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const markInk = (amount: number) => {
      ink.current += amount
      if (ink.current > 24 && empty) {
        setEmpty(false)
        onChange?.(false)
      }
    }

    const clear = useCallback(() => setup(), [setup])

    useImperativeHandle(
      ref,
      () => ({
        clear,
        isEmpty: () => ink.current <= 24,
        toDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
        drawText: (text: string) => {
          const canvas = canvasRef.current
          const ctx = canvas?.getContext("2d")
          if (!canvas || !ctx) return
          setup()
          ctx.save()
          ctx.fillStyle = "#111111"
          ctx.font = `italic 44px "Rubik", Arial, sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.direction = "rtl"
          ctx.fillText(text, canvas.clientWidth / 2, HEIGHT / 2, canvas.clientWidth - 24)
          ctx.restore()
          ink.current = 1000
          setEmpty(false)
          onChange?.(false)
        },
      }),
      [clear, setup, onChange],
    )

    return (
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="אזור לחתימה בציור באצבע או בעכבר"
        aria-describedby={describedBy}
        style={{ height: HEIGHT, touchAction: "none" }}
        className={`w-full cursor-crosshair rounded-2xl border-2 bg-white ${invalid ? "border-[#b3261e]" : "border-dashed border-[rgba(17,17,17,0.3)]"}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          drawing.current = true
          const p = point(event)
          last.current = p
          const ctx = event.currentTarget.getContext("2d")
          ctx?.beginPath()
          ctx?.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
          ctx?.fill()
          markInk(2)
        }}
        onPointerMove={(event) => {
          if (!drawing.current || !last.current) return
          const ctx = event.currentTarget.getContext("2d")
          const p = point(event)
          if (!ctx) return
          ctx.beginPath()
          ctx.moveTo(last.current.x, last.current.y)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
          markInk(Math.hypot(p.x - last.current.x, p.y - last.current.y))
          last.current = p
        }}
        onPointerUp={() => {
          drawing.current = false
          last.current = null
        }}
        onPointerCancel={() => {
          drawing.current = false
          last.current = null
        }}
      />
    )
  },
)
