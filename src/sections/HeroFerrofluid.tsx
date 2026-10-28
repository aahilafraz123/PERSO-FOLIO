import { useRef } from "react"
import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { profile } from "@/content/profile"
import { PlayRandom } from "@/components/PlayRandom"
import Ferrofluid from "@/components/bits/Ferrofluid"

/*
 * Ferrofluid. A dark sea of magnetic fluid seen low across its surface: swells of spikes roll in
 * toward you, the cursor raises a crown wherever it goes, and a click sends a ring out through it.
 * The copy sits in the open dark above the horizon.
 *
 * Leaving it: the page below rises over the hero as a rounded sheet and flattens as it docks, while the
 * hero lags behind, shrinks into a rounded card and dims, and the copy lifts away. All of it is scrubbed to the
 * scroll, nothing pinned.
 */

export function HeroFerrofluid() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const intro = gsap.timeline({ delay: 0.15 })
      intro
        .from(".hero-eyebrow", { y: 12, opacity: 0, duration: 1 }, 0.5)
        .from(".hero-title", { y: 22, opacity: 0, filter: "blur(10px)", duration: 1.3, ease: "expo.out" }, 0.65)
        .from(".hero-sub", { y: 12, opacity: 0, duration: 1 }, 0.9)
        .from(".hero-cta > *", { y: 14, opacity: 0, stagger: 0.07, duration: 0.9 }, 1.05)
      if (prefersReducedMotion()) {
        intro.progress(1)
        return
      }

      const section = root.current!
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true } })
        .to(section, { yPercent: 55 }, 0)
        // Flat on purpose: a 3D tilt or an animated rounded overflow clip on the layer that holds the WebGL
        // canvas makes Chrome drop the layer on some frames, so the hero flickers out mid-scroll. A 2D scale
        // and a clip-path keep it on one stable composited layer.
        .fromTo(".hero-stage", { clipPath: "inset(0% round 0px)" }, { scale: 0.82, clipPath: "inset(0% round 48px)" }, 0)
        .to(".hero-dim", { opacity: 0.8 }, 0)
        .to(".hero-copy", { yPercent: -35, opacity: 0, duration: 0.45 }, 0)

      // The sheet: its rounded top flattens as it reaches the top of the screen.
      const sheet = document.querySelector<HTMLElement>("[data-hero-sheet]")
      if (sheet) {
        gsap.to(sheet, {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          ease: "power1.in",
          scrollTrigger: { trigger: sheet, start: "top 35%", end: "top top", scrub: true },
        })
      }
      ScrollTrigger.refresh()
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative z-0 h-[100svh] min-h-[600px] bg-[#f5f5f7]">
      <div className="hero-stage absolute inset-0 origin-[50%_35%] bg-[#040405] will-change-transform">
        <div aria-hidden className="absolute inset-0">
          <Ferrofluid
            tilt={48}
            scale={1.6}
            speed={0.45}
            spikeHeight={1}
            sharpness={2.5}
            brightness={1}
            flowDirection="down"
            mouseRadius={0.2}
            dpr={1.25}
          />
        </div>
        {/* Keeps the copy clean where the fluid rises behind it. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-[#040405] via-[#040405]/80 to-transparent" />

        <div className="hero-copy container-x absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[clamp(7rem,17vh,10rem)] text-center">
          <p className="hero-eyebrow font-mono text-[11px] uppercase tracking-[0.28em] text-white/50">
            {profile.location}
          </p>
          <h1 className="hero-title mt-5 max-w-[14ch] text-[clamp(2.75rem,7vw,6.25rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white">
            <span className="sr-only">{profile.name}, </span>
            Software engineer with taste.
          </h1>
          <p className="hero-sub mt-5 text-[15px] text-white/55">
            {profile.name}
            <span className="mx-2 opacity-50">·</span>
            Engineer, designer, photographer, musician
          </p>

          <div className="hero-cta mt-9 flex flex-wrap items-center justify-center gap-3">
            <div>
              <Link
                to="/work"
                className="group inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-[#1d1d1f] transition-transform duration-300 hover:scale-[1.03]"
              >
                See the work
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div>
              <Link
                to="/contact"
                className="inline-flex h-13 items-center rounded-full border border-white/15 bg-white/[0.04] px-7 text-[15px] font-semibold text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/10"
              >
                Book a call
              </Link>
            </div>
          </div>
          <div className="hero-cta mt-4 flex justify-center">
            <div>
              <PlayRandom />
            </div>
          </div>
        </div>
        <div aria-hidden className="hero-dim pointer-events-none absolute inset-0 z-20 bg-black opacity-0" />
      </div>
    </section>
  )
}
