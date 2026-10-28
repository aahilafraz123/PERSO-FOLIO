import { useRef, type ReactNode } from "react"
import { useSectionKey } from "@/hooks/useSectionKey"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** Curtain wipe + content rise on every route change. */
export function PageTransition({ children }: { children: ReactNode }) {
  const section = useSectionKey()
  const curtain = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline()
      tl.fromTo(curtain.current, { scaleY: 1, transformOrigin: "50% 0%" }, { scaleY: 0, duration: 0.75, ease: "expo.inOut" })
      // Re-measure once the content settles, so pinned sections (the home hero) start exactly at the top.
      tl.from(content.current, { y: 40, opacity: 0, duration: 0.8, ease: "expo.out", clearProps: "all", onComplete: () => ScrollTrigger.refresh() }, "-=0.45")
    },
    { dependencies: [section] },
  )

  return (
    <>
      {/* The curtain takes the destination's tone so the darkroom never flashes light. */}
      <div
        ref={curtain}
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[60] origin-top scale-y-0 ${section === "studio" ? "bg-[#050505]" : "bg-[#f5f5f7]"}`}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ember to-transparent" />
      </div>
      <div ref={content} key={section}>
        {children}
      </div>
    </>
  )
}
