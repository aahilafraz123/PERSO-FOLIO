import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { gsap } from "./gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

type Props = {
  children: ReactNode
  className?: string
  max?: number
  glare?: boolean
}

/**
 * Pointer-driven 3D tilt with a moving glare. Rect is measured once per hover and
 * everything animates via transforms (gsap.quickTo), so hovering never triggers layout or paint.
 */
export function TiltCard({ children, className, max = 9, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const shine = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !matchMedia("(pointer: fine)").matches) return
    // The springy return on leave overwrites these tweens, so they are rebuilt on every hover.
    const tilt = () => [gsap.quickTo(el, "rotateX", { duration: 0.8, ease: "power3.out" }), gsap.quickTo(el, "rotateY", { duration: 0.8, ease: "power3.out" })]
    let [rx, ry] = tilt()
    const gx = shine.current && gsap.quickTo(shine.current, "x", { duration: 0.6, ease: "power3.out" })
    const gy = shine.current && gsap.quickTo(shine.current, "y", { duration: 0.6, ease: "power3.out" })
    let box: DOMRect | null = null

    const enter = () => {
      ;[rx, ry] = tilt()
      return (box = el.getBoundingClientRect())
    }
    const move = (e: PointerEvent) => {
      const rect = box ?? enter()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      ry((px - 0.5) * max * 2)
      rx((0.5 - py) * max * 2)
      if (gx && gy) {
        gx(e.clientX - rect.left)
        gy(e.clientY - rect.top)
      }
    }
    const leave = () => {
      box = null
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1.1, ease: "elastic.out(1, 0.6)", overwrite: true })
    }
    el.addEventListener("pointerenter", enter)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      el.removeEventListener("pointerenter", enter)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
    }
  }, [max])

  return (
    <div className="perspective h-full">
      <div ref={ref} className={cn("group/tilt preserve-3d relative h-full", className)}>
        {children}
        {glare && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div
              ref={shine}
              className="absolute -left-[300px] -top-[300px] size-[600px] rounded-full opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
              style={{ background: "radial-gradient(circle, rgb(255 255 255 / 0.08), transparent 60%)" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
