/**
 * React Bits: FuzzyText (https://reactbits.dev/text-animations/fuzzy-text), ported to TypeScript.
 * Local changes, all for using it as a legible headline:
 *  - Draws at the device pixel ratio, so the text is sharp on Retina screens (the original is 1x).
 *  - `gradientDirection` lets the gradient run top to bottom, for the site's titanium type.
 *  - `letterSpacing` also accepts em (e.g. "-0.04em"), to match the display type's tracking.
 *  - Re-measures on resize, so a clamp()/vw font size stays right.
 *  - No touch handlers: the original called preventDefault on touchmove, which blocked scrolling
 *    the page with a thumb on the text. Hover is a mouse thing anyway.
 *  - Pauses while off screen, and draws one still frame with reduced motion.
 *  - Tighter side margin (just the fuzz range), so the text isn't scaled down on narrow screens.
 *  - Glitch and click bursts are dropped (not used here).
 */
import { Children, useEffect, useRef, useState, type ReactNode } from "react"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

type Props = {
  children: ReactNode
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  color?: string
  enableHover?: boolean
  baseIntensity?: number
  hoverIntensity?: number
  fuzzRange?: number
  fps?: number
  direction?: "horizontal" | "vertical"
  /** Milliseconds to ease between the resting and hovered intensity. */
  transitionDuration?: number
  gradient?: string[] | null
  gradientDirection?: "horizontal" | "vertical"
  /** Extra space between characters: px as a number, or a string in em. */
  letterSpacing?: number | string
  className?: string
}

export default function FuzzyText({
  children,
  fontSize = "clamp(2rem, 8vw, 8rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 0,
  gradient = null,
  gradientDirection = "horizontal",
  letterSpacing = 0,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Bumped on resize (debounced) so a responsive font size is re-measured.
  const [layout, setLayout] = useState(0)
  const text = Children.toArray(children).join("")
  const gradientKey = gradient?.join("|") ?? ""

  useEffect(() => {
    let t = 0
    const onResize = () => {
      clearTimeout(t)
      t = window.setTimeout(() => setLayout((n) => n + 1), 150)
    }
    window.addEventListener("resize", onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    let cancelled = false
    let detach = () => {}

    const init = async () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const family = fontFamily === "inherit" ? window.getComputedStyle(canvas).fontFamily || "sans-serif" : fontFamily
      const sizeCss = typeof fontSize === "number" ? `${fontSize}px` : fontSize
      try {
        await document.fonts.load(`${fontWeight} ${sizeCss} ${family}`)
      } catch {
        await document.fonts.ready
      }
      if (cancelled) return

      // Resolve the CSS size (clamp, vw, rem...) to px, then work in device pixels throughout.
      let cssPx: number
      if (typeof fontSize === "number") cssPx = fontSize
      else {
        const probe = document.createElement("span")
        probe.style.fontSize = fontSize
        document.body.appendChild(probe)
        cssPx = parseFloat(window.getComputedStyle(probe).fontSize)
        document.body.removeChild(probe)
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const px = cssPx * dpr
      const spacing = (typeof letterSpacing === "string" && letterSpacing.endsWith("em") ? parseFloat(letterSpacing) * cssPx : Number(letterSpacing) || 0) * dpr
      const range = fuzzRange * dpr
      const font = `${fontWeight} ${px}px ${family}`

      const off = document.createElement("canvas")
      const offCtx = off.getContext("2d")
      if (!offCtx) return
      offCtx.font = font
      offCtx.textBaseline = "alphabetic"

      const chars = [...text]
      let spacedWidth = 0
      if (spacing !== 0) {
        for (const ch of chars) spacedWidth += offCtx.measureText(ch).width + spacing
        spacedWidth -= spacing
      }
      const m = offCtx.measureText(text)
      const left = m.actualBoundingBoxLeft ?? 0
      const right = spacing !== 0 ? spacedWidth : (m.actualBoundingBoxRight ?? m.width)
      const ascent = m.actualBoundingBoxAscent ?? px
      const descent = m.actualBoundingBoxDescent ?? px * 0.2
      const textW = Math.ceil(spacing !== 0 ? spacedWidth : left + right)
      const textH = Math.ceil(ascent + descent)
      const pad = 10 * dpr
      const offW = textW + pad
      off.width = offW
      off.height = textH

      offCtx.font = font
      offCtx.textBaseline = "alphabetic"
      if (gradient && gradient.length >= 2) {
        const g = gradientDirection === "vertical" ? offCtx.createLinearGradient(0, 0, 0, textH) : offCtx.createLinearGradient(0, 0, offW, 0)
        gradient.forEach((c, i) => g.addColorStop(i / (gradient.length - 1), c))
        offCtx.fillStyle = g
      } else offCtx.fillStyle = color
      const x0 = pad / 2
      if (spacing !== 0) {
        let x = x0
        for (const ch of chars) {
          offCtx.fillText(ch, x, ascent)
          x += offCtx.measureText(ch).width + spacing
        }
      } else offCtx.fillText(text, x0 - left, ascent)

      // Room for the fuzz to spill sideways, and no more: extra margin just shrinks the text on phones.
      const margin = range + 4 * dpr
      canvas.width = offW + margin * 2
      canvas.height = textH
      canvas.style.width = `${canvas.width / dpr}px`
      canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`
      ctx.setTransform(1, 0, 0, 1, margin, 0)

      const hitL = margin + x0
      const hitR = hitL + textW
      let hovering = false
      let current = baseIntensity
      let last = 0
      let visible = true
      const frameMs = 1000 / fps

      const draw = (intensity: number) => {
        ctx.clearRect(-margin, 0, canvas.width, canvas.height)
        if (direction === "horizontal") {
          for (let j = 0; j < textH; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * range)
            ctx.drawImage(off, 0, j, offW, 1, dx, j, offW, 1)
          }
        } else {
          for (let i = 0; i < offW; i++) {
            const dy = Math.floor(intensity * (Math.random() - 0.5) * range)
            ctx.drawImage(off, i, 0, 1, textH, i, dy, 1, textH)
          }
        }
      }

      if (prefersReducedMotion()) {
        draw(0)
        return
      }

      const run = (ts: number) => {
        if (cancelled || !visible) return
        raf = requestAnimationFrame(run)
        if (ts - last < frameMs) return
        last = ts
        const target = hovering ? hoverIntensity : baseIntensity
        if (transitionDuration > 0) {
          const step = (Math.abs(hoverIntensity - baseIntensity) || 1) * (frameMs / transitionDuration)
          current = current < target ? Math.min(current + step, target) : Math.max(current - step, target)
        } else current = target
        draw(current)
      }
      raf = requestAnimationFrame(run)

      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        cancelAnimationFrame(raf)
        if (visible && !cancelled) raf = requestAnimationFrame(run)
      })
      io.observe(canvas)

      const onMove = (e: MouseEvent) => {
        const r = canvas.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * canvas.width
        const y = ((e.clientY - r.top) / r.height) * canvas.height
        hovering = x >= hitL && x <= hitR && y >= 0 && y <= textH
      }
      const onLeave = () => (hovering = false)
      if (enableHover) {
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("mouseleave", onLeave)
      }
      detach = () => {
        io.disconnect()
        canvas.removeEventListener("mousemove", onMove)
        canvas.removeEventListener("mouseleave", onLeave)
      }
    }

    init()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      detach()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontSize, fontWeight, fontFamily, color, enableHover, baseIntensity, hoverIntensity, fuzzRange, fps, direction, transitionDuration, gradientKey, gradientDirection, letterSpacing, layout])

  return <canvas ref={canvasRef} className={className} />
}
