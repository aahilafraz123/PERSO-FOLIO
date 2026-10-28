import { useRef } from "react"
import { Link } from "react-router"
import { ArrowUpRight, Download, MapPin } from "lucide-react"
import { profile } from "@/content/profile"
import { photos } from "@/content/photos"
import { Parallax } from "@/motion/Parallax"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/** A photo I took, in place of a graphic: the angel at 30th Street Station, Philadelphia, the city I build from. */
const shot = photos.find((p) => p.name === "work.jpg")

const line1 = ["What", "I've", "built,"]
const line2 = ["and", "what", "happened", "next."]

export function WorkHero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ delay: 0.25 })
      tl.from(".hw", { yPercent: 115, duration: 1.1, stagger: 0.06, ease: "expo.out" })
        .from(".hero-sub > *", { y: 24, opacity: 0, stagger: 0.08, duration: 0.9 }, "-=0.7")
        // The print develops: the frame wipes open from the bottom while the photo settles from a push-in.
        .from(".shot-frame", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, "-=1.1")
        .from(".shot-img", { scale: 1.45, duration: 2, ease: "expo.out" }, "<0.15")
        .from(".shot-meta > *", { y: 14, opacity: 0, stagger: 0.08, duration: 0.8 }, "-=1.2")

      // Looking through a window: the photo drifts a little against the cursor.
      const img = root.current?.querySelector<HTMLElement>(".shot-img")
      const frame = root.current?.querySelector<HTMLElement>(".shot-frame")
      if (!img || !frame || !window.matchMedia("(pointer: fine)").matches) return
      const toX = gsap.quickTo(img, "x", { duration: 1.2, ease: "power3.out" })
      const toY = gsap.quickTo(img, "y", { duration: 1.2, ease: "power3.out" })
      const move = (e: PointerEvent) => {
        const r = frame.getBoundingClientRect()
        toX(((e.clientX - r.left) / r.width - 0.5) * -28)
        toY(((e.clientY - r.top) / r.height - 0.5) * -20)
      }
      const leave = () => {
        toX(0)
        toY(0)
      }
      frame.addEventListener("pointermove", move)
      frame.addEventListener("pointerleave", leave)
      return () => {
        frame.removeEventListener("pointermove", move)
        frame.removeEventListener("pointerleave", leave)
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative isolate overflow-hidden">
      {/* Ambient warmth behind the photo. */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 -z-10 size-[720px] rounded-full bg-[radial-gradient(closest-side,rgb(255_107_44/0.16),rgb(255_61_110/0.06)_55%,transparent)] blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 -z-10 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(26_86_196/0.08),transparent)] blur-2xl" />

      <div className="container-x pb-24 pt-40 md:pb-32 md:pt-48">
        <h1 className="display-lg max-w-6xl">
          <span className="block overflow-hidden pb-[0.12em]">
            {line1.map((w) => (
              <span key={w} className="hw mr-[0.22em] inline-block">
                {w}
              </span>
            ))}
            <span className="hw inline-block align-middle">
              <span aria-hidden className="work-pill inline-block h-[0.62em] w-[1.5em] -translate-y-[0.06em] rounded-full" />
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.12em]">
            {line2.map((w) => (
              <span key={w} className={cn("hw mr-[0.22em] inline-block", w === "next." && "text-ember-grad")}>
                {w}
              </span>
            ))}
          </span>
        </h1>

        <div className="mt-12 grid items-end gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="hero-sub max-w-xl">
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              Seven projects, from a NASA hackathon to enterprise security tooling at Comcast. Each one says what it did, with the numbers in plain
              words and the code linked where it's public.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={profile.links.resume} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5">
                <Download className="size-4" /> Resume
              </a>
              <a href={profile.links.github} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline bg-background/60 px-5 text-sm font-semibold backdrop-blur transition-colors hover:bg-foreground/5">
                GitHub <ArrowUpRight className="size-4" />
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline bg-background/60 px-5 text-sm font-semibold backdrop-blur transition-colors hover:bg-foreground/5">
                LinkedIn <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>

          {/* One photo of mine, bleeding off the right edge like a print pinned past the margin. */}
          {shot && (
            <figure className="lg:mr-[calc((min(100vw,1440px)-100vw)/2-3.5rem)]">
              <Link
                to="/studio#photos"
                aria-label="The angel statue at 30th Street Station, Philadelphia, a photo I took. More photos in the Studio"
                className="shot-frame group relative block aspect-[4/3] overflow-hidden rounded-[28px] bg-[#0b0d10] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.45)] lg:aspect-auto lg:h-[min(560px,62vh)] lg:rounded-r-none"
              >
                <Parallax depth={0.08} className="absolute inset-0">
                  <img
                    src={shot.src}
                    width={shot.w}
                    height={shot.h}
                    alt=""
                    decoding="async"
                    fetchPriority="high"
                    className="shot-img size-full scale-[1.12] object-cover object-[50%_40%] transition-[filter] duration-700 group-hover:brightness-110"
                  />
                </Parallax>
                {/* Grounds the marker; the top stays clean so the skyline reads. */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 py-1 pl-2 pr-2.5 text-[12px] font-medium text-white backdrop-blur-md md:bottom-6 md:left-6">
                  <MapPin className="size-3.5 text-ember" aria-hidden />
                  30th Street Station, Philadelphia
                  <span className="hidden pl-1 font-mono text-[10px] tracking-wide text-white/60 sm:inline">39.96° N, 75.18° W</span>
                </span>
              </Link>
              <figcaption className="shot-meta mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground lg:pr-[calc((100vw-min(100vw,1440px))/2+3.5rem)]">
                <span>I took this one. Philadelphia is where I live and build.</span>
                <Link to="/studio#photos" className="inline-flex shrink-0 items-center gap-1 transition-colors hover:text-foreground">
                  More photos <ArrowUpRight className="size-3.5" />
                </Link>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
