import { Fragment, useRef, useState } from "react"
import { ArrowRight, ArrowUpRight, Info, Lock, X } from "lucide-react"
import { builds, type Build } from "@/content/vault"
import { profile } from "@/content/profile"
import { BrandIcon } from "@/components/BrandIcon"
import { useLenis } from "@/motion/SmoothScroll"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/** "11,500+" -> pieces a counter can animate; null when the value isn't a plain number ("2FA"). */
function parseMetric(v: string) {
  const m = v.match(/^(\D*)([\d,]+)(.*)$/)
  if (!m || !/^(k?\+|%|h|s)?$/.test(m[3])) return null
  return { pre: m[1], n: Number(m[2].replace(/,/g, "")), post: m[3], commas: m[2].includes(",") }
}

/** Projects in rows of two, with the GitHub tile closing the last row. */
const rows: (Build | "more")[][] = []
;[...builds, "more" as const].forEach((x, i) => (i % 2 ? rows[rows.length - 1].push(x) : rows.push([x])))

/** Rows stack only where a whole row fits on screen; elsewhere they simply follow each other. */
const STACK = "(min-width: 1024px) and (min-height: 860px)"
/** Where a row sticks, just under the floating header. Each later row sits a little lower, so the edges of earlier rows show above it. */
const TOP = 96
const STEP = 14

/**
 * The projects, two side by side. Scrolling down brings the next two up over the last pair,
 * which shrinks back like a deck, so each pair gets the whole screen in turn. The chips jump
 * to a project. Hovering a card's picture (or tapping "How it works") slides up how it works
 * and what it's built with.
 */
export function Builds() {
  const root = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const rowEls = gsap.utils.toArray<HTMLElement>(".bi-row")
      rowEls.forEach((row, i) => {
        ScrollTrigger.create({ trigger: row, start: "top 60%", end: "bottom 60%", onToggle: (s) => s.isActive && setActive(i) })
      })
      if (prefersReducedMotion()) return
      gsap.from(".bi-head", { y: 40, autoAlpha: 0, stagger: 0.08, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
      rowEls.forEach((row) => {
        gsap.from(row.querySelectorAll(".bi-card"), { y: 90, autoAlpha: 0, stagger: 0.12, duration: 1.1, scrollTrigger: { trigger: row, start: "top 85%", once: true } })
        row.querySelectorAll<HTMLElement>(".bi-num").forEach((el) => {
          const p = parseMetric(el.dataset.value ?? "")
          if (!p || !p.n) return
          const show = (n: number) => (el.textContent = p.pre + (p.commas ? n.toLocaleString("en-US") : n) + p.post)
          const o = { v: 0 }
          show(0)
          gsap.to(o, { v: p.n, duration: 1.4, delay: 0.3, ease: "power2.out", onUpdate: () => show(Math.round(o.v)), scrollTrigger: { trigger: row, start: "top 80%", once: true } })
        })
      })
      const mm = gsap.matchMedia()
      mm.add(STACK, () => {
        rowEls.slice(0, -1).forEach((row, i) => {
          gsap.to(row.querySelector(".bi-row-inner"), {
            scale: 0.92,
            autoAlpha: 0.35,
            ease: "none",
            scrollTrigger: { trigger: rowEls[i + 1], start: "top bottom", end: `top ${TOP + (i + 1) * STEP + 40}px`, scrub: true },
          })
        })
      })
    },
    { scope: root },
  )

  // Jump to a row by the marker before it: a stuck row reports where it's stuck, not where it sits.
  const jump = (i: number) => {
    const el = document.getElementById(`bi-at-${Math.floor(i / 2)}`)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -TOP, duration: 1.2 })
    else el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section ref={root} id="projects" aria-labelledby="projects-title" className="relative pb-24 pt-12 md:pb-32 md:pt-20">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="bi-head eyebrow">Projects</p>
            <h2 id="projects-title" className="bi-head display-md mt-4">
              Things I've built.
            </h2>
          </div>
          <ul className="bi-head flex flex-wrap gap-2" aria-label="Jump to a project">
            {builds.map((b, i) => {
              const on = Math.floor(i / 2) === active
              return (
                <li key={b.id}>
                  <button
                    onClick={() => jump(i)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                      on ? "border-foreground bg-foreground text-background" : "border-hairline bg-white text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span aria-hidden className="grid size-5 place-items-center rounded-md bg-white text-[10px] text-foreground ring-1 ring-black/[0.06]">
                      {b.logo ? <img src={b.logo} alt="" className="size-3.5" /> : b.title[0]}
                    </span>
                    {b.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-10">
          {rows.map((row, i) => (
            <Fragment key={i}>
              <div id={`bi-at-${i}`} aria-hidden />
              <div className="bi-row mb-6 last:mb-0 lg:mb-10 [@media(min-width:1024px)_and_(min-height:860px)]:sticky" style={{ top: TOP + i * STEP }}>
                <div className="bi-row-inner grid origin-top gap-6 lg:grid-cols-2">
                  {row.map((x) => (x === "more" ? <MoreTile key="more" /> : <Card key={x.id} b={x} />))}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({ b }: { b: Build }) {
  const [open, setOpen] = useState(false)
  return (
    <article
      id={`build-${b.id}`}
      aria-labelledby={`build-${b.id}-title`}
      className="bi-card flex flex-col rounded-3xl border border-hairline bg-white"
    >
      <div className="p-6 pb-4 md:px-7 md:pt-6">
        <div className="flex items-center gap-3">
          <Mark b={b} />
          <p className="text-[13px] font-medium text-muted-foreground">{b.kicker}</p>
        </div>
        <h3 id={`build-${b.id}-title`} className="mt-4 text-balance text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[30px] lg:text-[26px] xl:text-[28px]">
          {b.titlePrefix && <span className="text-foreground/45">{b.titlePrefix} – </span>}
          {b.title}
        </h3>
        <p className="mt-2 text-pretty text-[15px] leading-relaxed text-foreground/70 lg:min-h-[3.25em]">{b.line}</p>
      </div>

      {/* The picture, with how-it-works sliding up over it on hover or tap. */}
      <div className="group/visual relative mx-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[#f2f2f4] ring-1 ring-black/[0.06] md:mx-7">
        <Visual b={b} />
        <div
          data-lenis-prevent
          className={cn(
            "absolute inset-0 z-20 overflow-y-auto bg-white/[0.97] p-5 backdrop-blur transition-transform duration-500 ease-[var(--ease-out-expo)] md:p-6",
            open ? "translate-y-0" : "translate-y-full [@media(hover:hover)]:group-hover/visual:translate-y-0",
          )}
        >
          <p className="eyebrow">How it works</p>
          <ol className="mt-3 space-y-2.5">
            {b.points.map((p, i) => (
              <li key={p} className="flex gap-3 text-[13.5px] leading-snug text-foreground/85">
                <span className="mt-[2px] font-mono text-[10px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                {p}
              </li>
            ))}
          </ol>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {b.stack.map((s) => (
              <li key={s} className="rounded-md bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px] text-foreground/75">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "absolute bottom-3 right-3 z-30 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold shadow-lg transition-opacity",
            open ? "bg-white text-foreground ring-1 ring-black/10" : "bg-foreground/90 text-background backdrop-blur [@media(hover:hover)]:group-hover/visual:opacity-0",
          )}
        >
          {open ? <X className="size-3.5" /> : <Info className="size-3.5" />}
          {open ? "Close" : "How it works"}
        </button>
      </div>

      <dl className="mx-6 mt-4 grid grid-cols-3 gap-4 md:mx-7">
        {b.metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <dt className="bi-num text-[26px] font-semibold leading-none tracking-[-0.035em] tabular-nums md:text-[30px]" data-value={m.value}>
              {m.value}
            </dt>
            <dd className="mt-2 text-[12px] leading-snug text-muted-foreground">{m.label}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 p-6 pt-5 md:px-7 md:pb-6">
        <CodeButton b={b} />
        {b.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {l.label} <ArrowUpRight className="size-3.5" />
          </a>
        ))}
      </div>
    </article>
  )
}

function Mark({ b }: { b: Build }) {
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-black/[0.08]">
      {b.logo ? <img src={b.logo} alt="" className="size-6" /> : <span className="text-[16px] font-semibold">{b.title[0]}</span>}
    </span>
  )
}

function CodeButton({ b }: { b: Build }) {
  if (b.repo)
    return (
      <a
        href={b.repo}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/85"
      >
        <BrandIcon name="github" className="size-3.5" /> View on GitHub <ArrowUpRight className="size-3.5 opacity-60" />
      </a>
    )
  if (b.codeNote)
    return (
      <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-dashed border-foreground/20 px-4 text-[13px] text-muted-foreground">
        <Lock className="size-3.5" /> {b.codeNote}
      </span>
    )
  return null
}

/** The picture for each card: a screenshot, layered phone screens, an image on its own colour, or a data flow. */
function Visual({ b }: { b: Build }) {
  const [shot, setShot] = useState(0)
  if (b.shots) {
    const s = b.shots[shot]
    return (
      <>
        <img key={s.src} src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" className="size-full object-cover object-left-top" />
        {b.shots.length > 1 && (
          <div className="absolute left-3 top-3 flex gap-1 rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
            {b.shots.map((x, i) => (
              <button
                key={x.src}
                onClick={() => setShot(i)}
                aria-pressed={i === shot}
                className={cn("h-7 rounded-full px-3 text-[12px] font-semibold transition-colors", i === shot ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                {x.label}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }
  if (b.phones) {
    // The first screen in front, two more behind it tipped outward.
    const row = [b.phones[1], b.phones[0], b.phones[2]].filter(Boolean)
    return (
      <div className="absolute inset-0 flex items-start justify-center pt-6">
        {row.map((s, i) => (
          <div
            key={s.src}
            className={cn(
              "w-[30%] shrink-0 overflow-hidden rounded-[1.4rem] border-[4px] border-[#1d1d1f] bg-[#1d1d1f] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] transition-transform duration-700 ease-[var(--ease-out-expo)]",
              i === 0 && "-mr-[4%] mt-6 -rotate-6",
              i === 1 && "relative z-10",
              i === 2 && "-ml-[4%] mt-6 rotate-6",
            )}
          >
            <img src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" className="block w-full rounded-[1.1rem]" />
          </div>
        ))}
      </div>
    )
  }
  if (b.art)
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: b.art.bg }}>
        <img src={b.art.src} alt={b.art.alt} loading="lazy" className="h-[86%] w-auto rounded-2xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]" />
      </div>
    )
  if (b.flow) {
    const f = b.flow
    return (
      <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-2 p-5 [background-image:radial-gradient(rgb(0_0_0/0.08)_1px,transparent_1.3px)] [background-size:18px_18px] md:gap-3 md:p-6">
        <ul className="space-y-1.5">
          {f.inputs.map((x) => (
            <li key={x} className="rounded-lg bg-white px-2.5 py-2 text-[12px] font-medium leading-tight shadow-sm ring-1 ring-black/[0.06]">
              {x}
            </li>
          ))}
        </ul>
        <ArrowRight className="size-4 text-dim" />
        <span className="rounded-xl bg-foreground px-3 py-2.5 text-[13px] font-semibold text-background shadow-lg">{f.engine}</span>
        <ArrowRight className="size-4 text-dim" />
        <span className="rounded-xl bg-white px-3 py-2.5 text-[12px] font-semibold leading-snug shadow-sm ring-2 ring-foreground/80">{f.output}</span>
      </div>
    )
  }
  return null
}

/** Last card in the row: everything else lives on GitHub. */
function MoreTile() {
  return (
    <a
      href={profile.links.github}
      target="_blank"
      rel="noreferrer"
      className="bi-card group flex min-h-[22rem] flex-col justify-between rounded-3xl bg-[#111113] p-7 text-white md:p-9"
    >
      <BrandIcon name="github" className="size-12 text-white" />
      <div>
        <p className="text-[30px] font-semibold leading-tight tracking-[-0.03em] md:text-[38px]">More on GitHub</p>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/65">Hackathon builds, experiments, and the code behind this site.</p>
        <span className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition-transform group-hover:scale-[1.03]">
          github.com/aahilafraz123 <ArrowUpRight className="size-4" />
        </span>
      </div>
    </a>
  )
}
