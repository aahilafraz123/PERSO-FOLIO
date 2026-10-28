import { useRef, type ReactNode } from "react"
import { gsap, useGSAP } from "./gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** Scroll-scrubbed vertical drift. depth > 0 moves slower than the page (farther away). */
export function Parallax({ children, depth = 0.2, className }: { children: ReactNode; depth?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      gsap.fromTo(
        ref.current,
        { yPercent: depth * 50 },
        {
          yPercent: -depth * 50,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      )
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
