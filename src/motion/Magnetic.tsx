import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "./gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/**
 * Pulls its child toward the cursor while the pointer is within `padding` px.
 * Pointer events on a padded hit area + gsap.quickTo: no React renders, no global listeners.
 */
export function Magnetic({ children, padding = 40, strength = 0.3 }: { children: ReactNode; padding?: number; strength?: number }) {
  const zone = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const z = zone.current
    const el = inner.current
    if (!z || !el || prefersReducedMotion() || !matchMedia("(pointer: fine)").matches) return
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" })
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" })
    let rect: DOMRect | null = null
    const enter = () => (rect = el.getBoundingClientRect())
    const move = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect()
      x((e.clientX - (rect.left + rect.width / 2)) * strength)
      y((e.clientY - (rect.top + rect.height / 2)) * strength)
    }
    const leave = () => {
      rect = null
      x(0)
      y(0)
    }
    z.addEventListener("pointerenter", enter)
    z.addEventListener("pointermove", move)
    z.addEventListener("pointerleave", leave)
    return () => {
      z.removeEventListener("pointerenter", enter)
      z.removeEventListener("pointermove", move)
      z.removeEventListener("pointerleave", leave)
    }
  }, [strength])

  return (
    <span ref={zone} className="inline-block" style={{ padding, margin: -padding }}>
      <span ref={inner} className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  )
}
