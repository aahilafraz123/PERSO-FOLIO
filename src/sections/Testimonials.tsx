import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { homeTestimonials as testimonials, type Testimonial } from "@/content/testimonials"
import { PersonName, QuoteWords, ReceiptCard } from "@/components/testimonials/parts"
import { ProofLightbox } from "@/components/work/EmailView"
import { RevealText } from "@/motion/RevealText"
import { useLenis } from "@/motion/SmoothScroll"
import { gsap, useGSAP } from "@/motion/gsap"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/** Resting tilt of each original, like prints dropped on a desk. */
const TILT = [-4, 3.5, -2.5]

/**
 * "In their words": three quotes in normal page flow, no pinning. The first time each one
 * scrolls into view it plays a short reveal on its own clock: the words light up, the key
 * phrase in the accent gradient, and the original drops in beside it. It plays once, only on
 * the way down; scrolling back up leaves everything as it is. Reduced motion skips it.
 */
export function Testimonials() {
  const root = useRef<HTMLElement>(null)
  const slides = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<{ t: Testimonial; text?: boolean } | null>(null)
  const lenis = useLenis()
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      gsap.utils.toArray<HTMLElement>(".t-slide").forEach((s, i) => {
        const tilt = TILT[i % TILT.length]
        const tl = gsap.timeline({ scrollTrigger: { trigger: s, start: "top 72%", once: true } })
        tl.fromTo(s.querySelectorAll(".t-word"), { opacity: 0.14 }, { opacity: 1, duration: 0.5, stagger: 0.025, ease: "power1.out" })
          .fromTo(
            s.querySelector(".t-receipt"),
            { xPercent: 30, yPercent: 8, rotate: tilt + 10, autoAlpha: 0 },
            { xPercent: 0, yPercent: 0, rotate: tilt, autoAlpha: 1, duration: 1.1, ease: "power3.out" },
            0.15,
          )
          .fromTo(s.querySelectorAll(".t-meta"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 0.35)
      })
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  )

  // Side index follows whichever quote is mid-screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" },
    )
    slides.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const jump = (i: number) => {
    const el = slides.current[i]
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -160, duration: 1.2 })
    else el.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <section ref={root} aria-label="Testimonials" className="theme-light tone-mist relative">
      <div className="container-x flex flex-col justify-between gap-6 pt-32 md:flex-row md:items-end md:pt-48">
        <RevealText as="h2" split="lines" className="display-lg max-w-5xl text-balance">
          In their words
        </RevealText>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Three people I worked with at Comcast. Every quote comes with the original: two LinkedIn recommendations and a note from my
          team's chat.
        </p>
      </div>

      <div className="container-x grid gap-10 pb-32 pt-20 md:pb-48 md:pt-28 lg:grid-cols-[8rem_minmax(0,1fr)] xl:gap-16">
        {/* Side index: where you are, and a way to skip ahead. */}
        <nav aria-label="Jump to a testimonial" className="hidden lg:sticky lg:top-[40vh] lg:block lg:self-start">
          <ol className="space-y-6 border-l border-hairline">
            {testimonials.map((t, i) => (
              <li key={t.id}>
                <button
                  onClick={() => jump(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={cn(
                    "-ml-px block border-l-2 pl-5 text-left transition-colors duration-500",
                    active === i ? "border-foreground text-foreground" : "border-transparent text-dim hover:text-foreground/70",
                  )}
                >
                  <span className="block font-mono text-[11px] tracking-[0.2em]">0{i + 1}</span>
                  <span className="mt-1 block text-lg font-semibold tracking-tight">{t.trait}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-28 md:space-y-36">
          {testimonials.map((t, i) => (
            <article
              key={t.id}
              ref={(el) => {
                slides.current[i] = el
              }}
              data-i={i}
              className="t-slide grid items-center gap-12 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20"
            >
            <figure className="min-w-0">
                <p className="t-meta eyebrow flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-ember" />0{i + 1} · {t.trait}
                </p>
                <span aria-hidden className="text-ember-grad mt-4 block h-[0.5em] font-serif text-[7rem] leading-[0.9] md:text-[9rem]">
                  “
                </span>
                <blockquote className="mt-2 text-pretty text-[clamp(1.85rem,3.3vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                  <QuoteWords t={t} />
                </blockquote>
                <figcaption className="t-meta mt-9 text-[15px] leading-relaxed">
                  <PersonName t={t} className="tracking-tight" />
                  <span className="text-muted-foreground"> · {t.shortTitle}</span>
                  {t.relationship && <span className="mt-1 block text-[13px] font-medium text-foreground/70">{t.relationship}</span>}
                </figcaption>
                <div className="t-meta mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium">
                  <button onClick={() => setOpen({ t, text: true })} className="inline-flex items-center gap-1 underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground">
                    Read the full note <ArrowUpRight className="size-3.5" />
                  </button>
                  {t.source.kind === "linkedin" ? (
                    <a href={t.source.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#0a66c2] underline-offset-4 hover:underline">
                      Verified on LinkedIn <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Teams message, shown as sent</span>
                  )}
                </div>
              </figure>

              <div className="mx-auto w-full max-w-[26rem] lg:mx-0 lg:justify-self-end">
                <ReceiptCard t={t} onOpen={() => setOpen({ t })} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <ProofLightbox receipt={open?.t.source.receipt ?? null} initialMode={open?.text ? "text" : undefined} onClose={() => setOpen(null)} />
    </section>
  )
}
