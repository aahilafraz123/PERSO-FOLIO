import { useRef } from "react"
import { gsap, SplitText, useGSAP } from "./gsap"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** Words fade from 0.12 to 1 opacity as you scroll through the paragraph. */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      const split = SplitText.create(ref.current, { type: "words", aria: "none" })
      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
        },
      )
    },
    { scope: ref },
  )

  return (
    <p ref={ref} className={cn("text-pretty", className)}>
      {text}
    </p>
  )
}
