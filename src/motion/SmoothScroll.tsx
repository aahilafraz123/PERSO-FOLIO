import Lenis from "lenis"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useLocation } from "react-router"
import { useSectionKey } from "@/hooks/useSectionKey"
import { gsap, ScrollTrigger } from "./gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

const LenisContext = createContext<Lenis | null>(null)
export const useLenis = () => useContext(LenisContext)

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const section = useSectionKey()
  const { hash } = useLocation()

  useEffect(() => {
    if (prefersReducedMotion()) return
    const instance = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -96 } })
    instance.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    setLenis(instance)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  // New page: jump to top instantly, then let triggers re-measure.
  // Links like /studio#photos then glide to their section once the page has settled.
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    const target = hash ? hash.slice(1) : ""
    const t = target
      ? window.setTimeout(() => {
          const el = document.getElementById(target)
          if (!el) return
          if (lenis) lenis.scrollTo(el, { offset: -96 })
          else el.scrollIntoView({ behavior: "smooth" })
        }, 900)
      : 0
    return () => {
      cancelAnimationFrame(id)
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
