import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, MousePointerClick, X } from "lucide-react"
import { designs, production, type Design } from "@/content/vault"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/** Widths the embedded sites lay out at: their desktop design, or their phone design in a narrow frame. */
const DESKTOP = 1440
const PHONE = 390

/**
 * Design work. Two live sites side by side, each laid out at full desktop width and shrunk to
 * fit, so they show the real desktop design. Each sits under its own click-to-explore shield,
 * so scrolling the page never gets trapped in a site. zarohealth.com closes the section as a
 * link, not an embed: its homepage, captured top to bottom, pans past on hover.
 */
export function DesignShowcase() {
  const root = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)

  // Don't load the embedded sites until the section is close.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".ds-in", { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } })
      gsap.utils.toArray<HTMLElement>(".ds-frame").forEach((el, i) => {
        gsap.fromTo(
          el,
          { rotateX: 22, rotateY: i ? -8 : 8, scale: 0.9, y: 60 },
          { rotateX: 0, rotateY: 0, scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 30%", scrub: true } },
        )
      })
      gsap.fromTo(".ds-prod", { rotateX: 12, scale: 0.94 }, { rotateX: 0, scale: 1, ease: "none", scrollTrigger: { trigger: ".ds-prod", start: "top bottom", end: "top 35%", scrub: true } })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="designs" aria-labelledby="designs-title" className="theme-dark relative isolate overflow-hidden bg-[#06060a] py-28 md:py-36">
      {/* One soft glow behind the frames, and the dot grid from the rest of the page. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[18%] size-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_107_44/0.16),transparent_62%)]" />
        <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgb(255_255_255/0.7)_1px,transparent_1.3px)] [background-size:24px_24px]" />
      </div>

      <div className="container-x">
        <p className="ds-in eyebrow text-white/60">Design</p>
        <h2 id="designs-title" className="ds-in display-lg mt-4 max-w-4xl text-balance">
          Designed by Aahil, <span className="text-ember-grad">with taste.</span>
        </h2>
        <p className="ds-in mt-5 max-w-xl text-lg text-white/70">
          These aren't screenshots. Both sites are running live right here: click one and scroll around inside it.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-6">
          {designs.map((d) => (
            <LiveFrame key={d.url} d={d} load={near} />
          ))}
        </div>

        <div className="mt-28 grid items-center gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <p className="eyebrow flex items-center gap-2 text-white/60">
              <span className="size-1.5 rounded-full bg-[#34c759]" /> Live in production
            </p>
            <h3 className="display-md mt-4">{production.name}</h3>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/75">{production.what}</p>
            <a
              href={production.url}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-transform hover:scale-[1.03]"
            >
              Visit {production.name} <ArrowUpRight className="size-4" />
            </a>
            <p className="mt-3 text-[13px] text-white/50">Opens the real site in a new tab.</p>
          </div>
          <LivePan />
        </div>
      </div>
    </section>
  )
}

/** One live site in a browser frame, laid out at a fixed width and scaled to fit the frame. */
function LiveFrame({ d, load }: { d: Design; load: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ site: DESKTOP, scale: 0.45 })
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      const site = w < 600 ? PHONE : DESKTOP
      setSize({ site, scale: w / site })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <figure className="perspective">
      <div
        className={cn(
          "ds-frame overflow-hidden rounded-2xl border bg-[#111114] shadow-[0_60px_120px_-50px_rgb(0_0_0/0.9)] transition-colors duration-300 [transform-origin:50%_0%]",
          live ? "border-white/60" : "border-white/15",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#34c759]/15 px-2 py-0.5 text-[11px] font-semibold text-[#4ade80]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-[#4ade80] opacity-70 motion-safe:animate-ping" />
              <span className="relative size-1.5 rounded-full bg-[#4ade80]" />
            </span>
            Live
          </span>
          <span className="mx-auto min-w-0 truncate rounded-lg bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/60">{d.url.replace("https://", "")}</span>
          <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-white/70 hover:text-white">
            New tab <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        <div ref={box} className="relative aspect-[3/4] overflow-hidden bg-white sm:aspect-[16/11]" onPointerLeave={(e) => e.pointerType === "mouse" && setLive(false)}>
          {load && (
            <iframe
              src={d.url}
              title={`${d.name}, live`}
              tabIndex={live ? 0 : -1}
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{ width: size.site, height: `${100 / size.scale}%`, transform: `scale(${size.scale})` }}
            />
          )}
          {/* Until clicked, a veil over the site says plainly that it's live and clickable. */}
          {!live ? (
            <button
              onClick={() => setLive(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 transition-colors duration-300 hover:bg-black/20"
              aria-label={`Explore ${d.name}, live`}
            >
              <span className="relative grid size-16 place-items-center rounded-full bg-white text-black shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <span aria-hidden className="absolute inset-0 rounded-full bg-white/50 motion-safe:animate-ping" />
                <MousePointerClick className="relative size-6" />
              </span>
              <span className="rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-black shadow-2xl">Click to explore the live site</span>
              <span className="text-[13px] font-medium text-white drop-shadow-[0_1px_8px_rgb(0_0_0/0.8)]">Scroll and click around. It's the real thing.</span>
            </button>
          ) : (
            <button
              onClick={() => setLive(false)}
              className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/85 px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xl backdrop-blur"
            >
              <X className="size-3.5" /> Done exploring
            </button>
          )}
        </div>
      </div>
      <figcaption className="mt-4 text-[14px] leading-relaxed text-white/65">
        {d.concept && <span className="mr-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[12px] font-semibold text-white">Unofficial concept</span>}
        <span className="font-semibold text-white">{d.name}.</span> {d.what}
      </figcaption>
    </figure>
  )
}

/**
 * zarohealth.com as a link: the homepage drifts past on hover (on its own where there's no
 * hover), and an "Open" badge follows the cursor. No browser frame, so it doesn't read as an embed.
 */
function LivePan() {
  const link = useRef<HTMLAnchorElement>(null)
  const badge = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = link.current
    const b = badge.current
    if (!el || !b || !matchMedia("(pointer: fine)").matches) return
    gsap.set(b, { xPercent: -50, yPercent: -50 })
    const x = gsap.quickTo(b, "x", { duration: 0.35, ease: "power3.out" })
    const y = gsap.quickTo(b, "y", { duration: 0.35, ease: "power3.out" })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x(e.clientX - r.left)
      y(e.clientY - r.top)
    }
    el.addEventListener("pointermove", move)
    return () => el.removeEventListener("pointermove", move)
  }, [])

  const p = production.page
  return (
    <div className="perspective">
      <a
        ref={link}
        href={production.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${production.name} in a new tab`}
        className="ds-prod group relative block h-[var(--h)] overflow-hidden rounded-3xl bg-[#f6f2ea] shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/10 [--h:440px] [transform-origin:50%_0%] md:[--h:560px] [@media(pointer:fine)]:cursor-none"
      >
        <img
          src={p.src}
          alt={`${production.name} home page, top to bottom`}
          width={p.width}
          height={p.height}
          loading="lazy"
          className="absolute inset-x-0 top-0 w-full transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:duration-[18s] group-hover:ease-linear group-hover:[transform:translateY(calc(-100%+var(--h)))] motion-safe:[@media(hover:none)]:animate-[vault-pan_40s_ease-in-out_infinite_alternate]"
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition-opacity [@media(pointer:fine)]:group-hover:opacity-0">
          {production.name} <ArrowUpRight className="size-3.5" />
        </span>
        <span
          ref={badge}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 hidden items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-black opacity-0 shadow-2xl transition-opacity duration-300 group-hover:opacity-100 [@media(pointer:fine)]:inline-flex"
        >
          Open {production.name} <ArrowUpRight className="size-3.5" />
        </span>
      </a>
    </div>
  )
}
