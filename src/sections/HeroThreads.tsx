import { useRef, useState } from "react"
import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { profile } from "@/content/profile"
import { PlayRandom } from "@/components/PlayRandom"
import Threads from "@/components/bits/Threads"
import { Proof } from "@/sections/Proof"

/*
 * Threads (React Bits). Cyan silk threads drift across the dark on their own, and bend a little
 * with the cursor. The copy sits in the open dark above them.
 *
 * Arriving: the threads fade in, the name rises into place, and the strip of places I've worked
 * slides in along the bottom.
 *
 * Leaving it, scrubbed to the scroll: the hero holds still (a sticky stage inside a section two
 * screens tall) while you dive into the threads. They spread apart, thicken and speed up as if
 * coming toward you, and the copy drifts up and blurs away. The strip picks up speed like a ticker
 * caught in the rush, rises and dissolves. About doesn't wait for it to end: it
 * rides up over the second half, see-through at the top, so its text sits in the threads before
 * they fade out behind it.
 *
 * Nothing on this stage animates a clip-path or a border-radius: changing those on the layer that
 * holds the WebGL canvas makes Chrome redraw it every frame, which is where flicker came from before.
 */

export function HeroThreads() {
  const root = useRef<HTMLElement>(null)
  // 0 at rest, 1 fully dived in. Threads reads it every frame.
  const dive = useRef({ current: 0 })

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Starts once the page curtain has lifted.
      gsap
        .timeline({ delay: 0.6 })
        .fromTo(".hero-threads", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power1.out" }, 0)
        .from(".hero-eyebrow", { y: 12, opacity: 0, duration: 0.9 }, 0.15)
        .from(".hero-word", { yPercent: 110, duration: 1.3, stagger: 0.09, ease: "expo.out" }, 0.2)
        .from(".hero-sub", { y: 14, opacity: 0, duration: 0.9 }, 0.55)
        .from(".hero-cta > *", { y: 14, opacity: 0, stagger: 0.07, duration: 0.9 }, 0.7)
        // The inner box, not .hero-strip itself: the scroll exit below tweens .hero-strip, and two tweens on one
        // element's opacity made the exit record the pre-intro opacity 0 and restore it on the way back up.
        .from(".hero-strip > div", { y: 24, opacity: 0, duration: 1.1, ease: "power2.out" }, 0.9)

      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 } })
        .to(dive.current, { current: 1, ease: "power2.in", duration: 1 }, 0)
        .to(".hero-threads", { scale: 1.18, ease: "power2.in", duration: 1 }, 0)
        .to(".hero-shade", { opacity: 0, duration: 0.45 }, 0)
        .to(".hero-copy", { yPercent: -18, opacity: 0, filter: "blur(10px)", duration: 0.45, ease: "power1.in" }, 0)
        // Gone before About's text comes up into the same space.
        .to(".hero-strip", { y: () => -window.innerHeight * 0.22, scale: 0.94, opacity: 0, filter: "blur(8px)", duration: 0.26, ease: "power1.in" }, 0.02)
        .to(".hero-dim", { opacity: 0.35, duration: 0.5, ease: "power1.in" }, 0.5)
      ScrollTrigger.refresh()
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative h-svh min-h-[600px] bg-[#050505] motion-safe:h-[200svh]">
      <div className="hero-stage sticky top-0 h-svh min-h-[600px] overflow-hidden bg-[#040405]">
        <div aria-hidden className="hero-threads absolute inset-0">
          <Threads color="#06b6d4" speed={0.6} enableMouseInteraction dive={dive.current} />
        </div>
        {/* Keeps the copy clean where the threads rise behind it; lifts as you dive in. */}
        <div aria-hidden className="hero-shade pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-[#040405] via-[#040405]/80 to-transparent" />

        <div className="hero-copy container-x absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[clamp(7rem,17vh,10rem)] text-center">
          <p className="hero-eyebrow font-mono text-[11px] uppercase tracking-[0.28em] text-white/55">
            Software engineer · {profile.location}
          </p>
          <h1 className="mt-5 text-[clamp(3.5rem,12vw,9.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white">
            {profile.name.split(" ").map((w) => (
              <span key={w} className="inline-block overflow-hidden pb-[0.08em] align-top [&:not(:last-child)]:mr-[0.22em]">
                <span className="hero-word inline-block">{w}</span>
              </span>
            ))}
          </h1>
          <p className="hero-sub mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-white/65 md:text-[20px]">
            I build AI products end to end, and I care about how they look and feel.
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
        <div className="hero-strip absolute inset-x-0 bottom-[7svh] z-10">
          <HeroStrip />
        </div>
        {/* Fades the stage into About's own dark, so one runs into the other. */}
        <div aria-hidden className="hero-dim pointer-events-none absolute inset-0 z-20 bg-[#050505] opacity-0" />
      </div>
    </section>
  )
}

/** The strip of places, speeding up as you scroll into the dive. Its own state, so only it re-renders. */
function HeroStrip() {
  const box = useRef<HTMLDivElement>(null)
  const [speed, setSpeed] = useState(45)
  useGSAP(() => {
    // Found from its own element: the hero's ref isn't attached yet when a child's effects first run.
    const section = box.current?.closest("section")
    if (prefersReducedMotion() || !section) return
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      // Ramps over the stretch where the strip is still visible. Stepped, so it re-renders a few
      // dozen times rather than every frame.
      onUpdate: (self) => setSpeed(45 + Math.round(Math.min(1, self.progress / 0.28) * 40) * 22),
    })
  })
  return (
    <div ref={box}>
      <Proof overlay speed={speed} />
    </div>
  )
}
