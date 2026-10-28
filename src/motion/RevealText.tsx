import { createElement, useRef, type ReactNode } from "react"
import { gsap, SplitText, useGSAP } from "./gsap"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

type Props = {
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span"
  children: ReactNode
  className?: string
  /** chars: letter rise, words: word rise + blur, lines: masked line slide. */
  split?: "chars" | "words" | "lines"
  delay?: number
  stagger?: number
  /** Animate on mount (hero) instead of on scroll. */
  immediate?: boolean
  start?: string
}

/**
 * Masked, staggered text reveal. Re-splits on resize/font load via autoSplit,
 * so line breaks stay correct at every width.
 */
export function RevealText({
  as: Tag = "div",
  children,
  className,
  split = "words",
  delay = 0,
  stagger,
  immediate = false,
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 })
        return
      }
      // The split waits for fonts, so it runs after this effect returns. contextSafe keeps the split
      // and its tween inside the context so cleanup reverts them, and `alive` stops a callback that
      // resolves after unmount. Without both, a double-mounted effect (StrictMode, HMR, fast route
      // changes) split the same heading twice and animated two stacked copies of each letter.
      let alive = true
      let splitter: SplitText | undefined
      const run = contextSafe!(() => {
        if (!alive || !ref.current) return
        gsap.set(el, { autoAlpha: 1 })
        splitter = SplitText.create(el, {
          type: split === "chars" ? "lines,words,chars" : split === "words" ? "lines,words" : "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "reveal-line",
          onSplit(self) {
            const targets = split === "chars" ? self.chars : split === "words" ? self.words : self.lines
            // Gradient text (background-clip: text) paints stale ghost glyphs in Chrome while letters
            // are mid-3D-flip. Those headings rise flat instead; plain text keeps the flip.
            const clipped = !!el.querySelector(".text-titanium, .text-ember-grad")
            return gsap.from(targets, {
              yPercent: split === "lines" ? 110 : 105,
              rotateX: split === "chars" && !clipped ? -70 : 0,
              force3D: !clipped,
              opacity: split === "lines" ? 1 : 0,
              transformOrigin: "50% 100% -20px",
              duration: split === "chars" ? 1 : 0.9,
              stagger: stagger ?? (split === "chars" ? 0.012 : split === "words" ? 0.035 : 0.08),
              delay,
              ease: "expo.out",
              scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
            })
          },
        })
      })
      document.fonts.ready.then(run)
      return () => {
        alive = false
        splitter?.revert()
      }
    },
    { scope: ref },
  )

  return createElement(Tag, { ref, className: cn("invisible [perspective:600px]", className) }, children)
}
