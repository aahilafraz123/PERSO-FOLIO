import { useEffect, useRef } from "react"
import { useAudio } from "./AudioProvider"
import { cn } from "@/lib/utils"

const EMBER = "#ff6b2c"
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/**
 * Radial frequency bars around a center point, drawn to canvas.
 * Idles as a slow breathing ring when nothing is playing.
 * `radius` is the ring's inner edge and `reach` the max bar length, both as a fraction of the canvas size.
 * Bars take the playing track's accent, easing between colors on track change.
 */
export function Visualizer({ className, bars = 96, radius = 0.3, reach = 0.22 }: { className?: string; bars?: number; radius?: number; reach?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { analyser, playing, current } = useAudio()
  const target = useRef(rgb(EMBER))
  const color = useRef(rgb(EMBER))

  useEffect(() => {
    target.current = rgb(current?.accent ?? EMBER)
  }, [current])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const g = canvas.getContext("2d")!
    let raf = 0
    const data = new Uint8Array(analyser?.frequencyBinCount ?? 128)

    const draw = (t: number) => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      if (analyser && playing) analyser.getByteFrequencyData(data)

      const c = color.current
      for (let k = 0; k < 3; k++) c[k] += (target.current[k] - c[k]) * 0.04
      const [r, gr, b] = c.map(Math.round)

      const cx = w / 2
      const cy = h / 2
      const size = Math.min(w, h)
      const base = size * radius
      g.lineWidth = 2
      g.lineCap = "round"
      for (let i = 0; i < bars; i++) {
        const bin = data[Math.floor((i / bars) * data.length * 0.75)] / 255
        const idle = 0.08 + 0.05 * Math.sin(t / 900 + i * 0.35)
        const v = playing ? Math.max(bin, 0.04) : idle
        const a = (i / bars) * Math.PI * 2 - Math.PI / 2
        const r2 = base + v * size * reach
        g.strokeStyle = `rgba(${r}, ${gr}, ${b}, ${0.2 + v * 0.8})`
        g.beginPath()
        g.moveTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base)
        g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
        g.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    // Only draw while on screen.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) raf = requestAnimationFrame(draw)
    })
    io.observe(canvas)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [analyser, playing, bars, radius, reach])

  return <canvas ref={ref} aria-hidden className={cn("h-full w-full", className)} />
}
