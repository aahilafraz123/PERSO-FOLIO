import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

const TOTAL = 11500
const NOMINEES = 1290
const REVEAL_MS = 2200

// Stable pseudo-random pick of which dots are nominees, in reveal order.
const order: number[] = (() => {
  const lit = new Uint8Array(TOTAL)
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const out: number[] = []
  while (out.length < NOMINEES) {
    const i = Math.floor(rand() * TOTAL)
    if (!lit[i]) {
      lit[i] = 1
      out.push(i)
    }
  }
  return out
})()
const US = order[Math.floor(NOMINEES * 0.62)]

/**
 * 11,500 dots, one per project entered. The top 1,290 light up in sequence, then
 * Team Relentless pulses. The grid is painted once; the reveal only paints newly lit
 * dots, and the loop stops for good when it finishes. The pulse is plain CSS.
 */
export function DotField({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const us = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = canvas.current
    const box = wrap.current
    if (!el || !box) return
    const g = el.getContext("2d", { alpha: true })!
    let revealed = 0
    let raf = 0
    let geo = { cols: 1, cw: 1, ch: 1, r: 1 }

    const pos = (i: number) => [(i % geo.cols) * geo.cw + geo.cw / 2, Math.floor(i / geo.cols) * geo.ch + geo.ch / 2]
    const dot = (i: number) => {
      const [x, y] = pos(i)
      g.fillRect(x - geo.r, y - geo.r, geo.r * 2, geo.r * 2)
    }

    const paintAll = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = box.clientWidth
      const h = box.clientHeight
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cols = Math.ceil(Math.sqrt((TOTAL * w) / h))
      const rows = Math.ceil(TOTAL / cols)
      const cw = w / cols
      const ch = h / rows
      geo = { cols, cw, ch, r: Math.max(0.6, Math.min(cw, ch) * 0.32) }

      g.fillStyle = "rgba(255,255,255,0.11)"
      for (let i = 0; i < TOTAL; i++) dot(i)
      g.fillStyle = "rgba(255,107,44,0.95)"
      for (let k = 0; k < revealed; k++) dot(order[k])
      placeUs()
    }

    const placeUs = () => {
      if (!us.current) return
      const [x, y] = pos(US)
      us.current.style.transform = `translate(${x}px, ${y}px)`
      us.current.style.opacity = revealed >= NOMINEES ? "1" : "0"
    }

    const reveal = () => {
      if (prefersReducedMotion()) {
        revealed = NOMINEES
        paintAll()
        return
      }
      const t0 = performance.now()
      g.fillStyle = "rgba(255,107,44,0.95)"
      const step = (now: number) => {
        const target = Math.min(NOMINEES, Math.floor(((now - t0) / REVEAL_MS) * NOMINEES))
        for (; revealed < target; revealed++) dot(order[revealed])
        if (revealed < NOMINEES) raf = requestAnimationFrame(step)
        else placeUs()
      }
      raf = requestAnimationFrame(step)
    }

    paintAll()

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect()
          reveal()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(box)

    let resizeRaf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(paintAll)
    })
    ro.observe(box)

    return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
      cancelAnimationFrame(resizeRaf)
    }
  }, [])

  return (
    <div ref={wrap} aria-hidden className={cn("pointer-events-none", className)}>
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <span ref={us} className="absolute left-0 top-0 opacity-0 transition-opacity duration-700">
        <span className="absolute -left-[5px] -top-[5px] size-[10px] rounded-full bg-white" />
        <span className="absolute -left-[5px] -top-[5px] size-[10px] animate-ping rounded-full bg-white/70" />
      </span>
    </div>
  )
}
