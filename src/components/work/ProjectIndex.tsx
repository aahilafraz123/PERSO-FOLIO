import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"
import { projects, categories, type Category } from "@/content/projects"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { useMedia } from "@/hooks/useMedia"
import { cn } from "@/lib/utils"

/** Preview card size. Kept small: it's a hint beside the cursor, not a second page. */
const CARD_W = 232
const CARD_H = 188

/**
 * Editorial project index. On desktop, resting on the list brings up a small preview card
 * beside the cursor that rolls to the hovered project; the other rows ease back a little.
 * On touch, each row shows its headline result inline instead.
 */
export function ProjectIndex() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<"All" | Category>("All")
  const [active, setActive] = useState<number | null>(null)
  const list = useMemo(() => (filter === "All" ? projects : projects.filter((p) => p.category === filter)), [filter])
  const fine = useMedia("(pointer: fine) and (min-width: 1024px)")

  const rows = useRef<HTMLOListElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const reel = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".idx-row", { y: 40, opacity: 0, stagger: 0.05, duration: 0.9, ease: "expo.out", clearProps: "transform,opacity" })
    },
    { scope: rows, dependencies: [filter], revertOnUpdate: true },
  )

  // Loose cursor-follow with only a faint lean in the direction of travel.
  useEffect(() => {
    const el = preview.current
    const zone = rows.current
    if (!el || !zone || !fine || prefersReducedMotion()) return
    const x = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" })
    const y = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" })
    const r = gsap.quickTo(el, "rotate", { duration: 1, ease: "power3.out" })
    gsap.set(el, { scale: 0.94 })
    // Sits beside the cursor rather than over the title; flips inside near the right edge.
    const cx = (v: number) => Math.min(v, window.innerWidth - CARD_W - 64)
    let last = 0
    const move = (e: PointerEvent) => {
      x(cx(e.clientX))
      y(e.clientY)
      r(gsap.utils.clamp(-3, 3, (e.clientX - last) * 0.25))
      last = e.clientX
    }
    const enter = (e: PointerEvent) => {
      last = e.clientX
      gsap.set(el, { x: cx(e.clientX), y: e.clientY })
      // A short pause first, so skimming past the list doesn't flash a card.
      gsap.to(el, { scale: 1, autoAlpha: 1, duration: 0.6, delay: 0.25, ease: "power2.out", overwrite: true })
    }
    const leave = () => {
      gsap.to(el, { scale: 0.94, autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true })
      setActive(null)
    }
    zone.addEventListener("pointermove", move)
    zone.addEventListener("pointerenter", enter)
    zone.addEventListener("pointerleave", leave)
    return () => {
      zone.removeEventListener("pointermove", move)
      zone.removeEventListener("pointerenter", enter)
      zone.removeEventListener("pointerleave", leave)
    }
  }, [fine])

  // Roll the reel to the hovered project.
  useEffect(() => {
    if (active === null || !reel.current) return
    gsap.to(reel.current, { yPercent: (-100 * active) / list.length, duration: 0.6, ease: "power3.out" })
  }, [active, list.length])

  return (
    <section aria-labelledby="every-project" className="theme-light">
      <div className="container-x py-32 md:py-44">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <h2 id="every-project" className="display-lg">
            Every project
          </h2>
          <div role="radiogroup" aria-label="Filter projects" className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full [scrollbar-width:none] border border-hairline bg-[#f5f5f7] p-1">
            {categories.map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={filter === c}
                onClick={() => setFilter(c)}
                className={cn(
                  "relative h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors duration-300",
                  filter === c ? "text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filter === c && <motion.span layoutId="idx-pill" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
        </div>

        <ol ref={rows} className="group/list border-t border-hairline">
          {list.map((p, i) => (
            <li key={p.slug} className="idx-row border-b border-hairline">
              <button
                onClick={() => navigate(`/work/${p.slug}`)}
                onPointerEnter={() => fine && setActive(i)}
                className={cn(
                  "group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-8 text-left transition-opacity duration-500 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,16rem)_auto] md:py-10",
                  fine && active !== null && active !== i && "opacity-50",
                )}
              >
                <span className="font-mono text-xs tabular-nums text-dim">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block text-[2rem] leading-[1.05] font-semibold tracking-tighter transition-transform sm:text-4xl duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 md:text-6xl">
                    {p.title}
                  </span>
                  <span className="mt-3 block max-w-2xl text-[15px] leading-snug text-muted-foreground md:text-base">{p.headline}</span>
                  {/* Touch and small screens: the top result, inline. */}
                  <span className="mt-4 block text-sm text-foreground/80 lg:hidden">
                    <strong className="font-semibold text-foreground">{p.metrics[0].value}</strong> {p.metrics[0].label}
                  </span>
                </span>
                <span className="hidden text-sm leading-snug text-muted-foreground md:block">
                  <span className="block text-foreground/80">{p.org.split(" · ")[0]}</span>
                  <span className="font-mono text-xs text-dim">{p.period}</span>
                </span>
                <span className="grid size-11 place-items-center self-center rounded-full border border-hairline transition-all duration-500 group-hover:rotate-45 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
                  <ArrowUpRight className="size-4" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Cursor preview: one card per project stacked in a reel; only the active one shows. */}
      {fine && (
        <div
          ref={preview}
          aria-hidden
          className="pointer-events-none invisible fixed left-0 top-0 z-30 ml-10 -mt-12 overflow-hidden rounded-[18px] opacity-0 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.35)]"
          style={{ width: CARD_W, height: CARD_H }}
        >
          <div ref={reel} style={{ height: `${list.length * 100}%` }}>
            {list.map((p) => (
              <div key={p.slug} className={cn("theme-dark relative flex flex-col justify-between bg-gradient-to-br p-5", p.hue)} style={{ height: `${100 / list.length}%` }}>
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_60%_at_20%_0%,rgb(255_255_255/0.1),transparent_60%)]" />
                <div className="relative">
                  <p className="eyebrow !text-[10px] !text-white/55">{p.category}</p>
                  <p className="mt-1.5 line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-white">{p.title}</p>
                </div>
                {/* Just the headline result. */}
                <div className="relative border-t border-white/15 pt-3">
                  <p className="text-2xl font-semibold tracking-tighter text-white">{p.metrics[0].value}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-white/65">{p.metrics[0].label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
