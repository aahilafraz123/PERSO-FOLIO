import { useRef, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { Aperture, ArrowDown, ArrowUpRight, CalendarDays, ChevronDown, Download, Home, LayoutGrid, Lock, Mail, Maximize2 } from "lucide-react"
import { profile } from "@/content/profile"
import { verifiedTestimonials, type Testimonial } from "@/content/testimonials"
import { certs, experience, type Experience } from "@/content/vault"
import { logos } from "@/components/logos"
import { BrandIcon } from "@/components/BrandIcon"
import { ProofLightbox } from "@/components/work/EmailView"
import { Builds } from "@/components/vault/Builds"
import { DesignShowcase } from "@/components/vault/DesignShowcase"
import { useLenis } from "@/motion/SmoothScroll"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"

/**
 * The recruiter page: the link on the resume and the answer to "any other online presence?".
 * The first screen is the pitch: who, availability, experience, certifications, and who
 * recommends him. Below it: the projects, the recommendations themselves, live design work,
 * and the way into the rest of the site. Nothing sends the visitor to a case study.
 */
export default function Vault() {
  usePageMeta(
    "Aahil Afraz — For Recruiters",
    "Aahil Afraz, software engineer. Resume, LinkedIn-verified recommendations from Comcast leadership, certifications, projects and live design work.",
  )
  const [proof, setProof] = useState<Testimonial | null>(null)

  return (
    <main className="theme-light relative isolate w-full max-w-full overflow-x-clip">
      {/* Absolute, not fixed: a fixed layer inside the page sheet's clip-path stops the page painting past the first screen. */}
      <div aria-hidden className="vault-bg pointer-events-none absolute inset-0 -z-10" />
      <Hero />
      <Builds />
      <Recommendations onOpen={setProof} />
      <DesignShowcase />
      <Explore />
      <ProofLightbox receipt={proof?.source.receipt ?? null} onClose={() => setProof(null)} />
    </main>
  )
}

/** Smooth-scrolls to an element on the page. */
function useScrollTo() {
  const lenis = useLenis()
  return (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -110, duration: 1.3 })
    else el.scrollIntoView({ behavior: "smooth" })
  }
}

function Hero() {
  const root = useRef<HTMLElement>(null)
  const scrollTo = useScrollTo()
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".hero-in", { y: 30, autoAlpha: 0, stagger: 0.06, duration: 1, delay: 0.1 })
      gsap.from(".hero-panel", { y: 50, autoAlpha: 0, duration: 1.2, delay: 0.3 })
    },
    { scope: root },
  )
  const [junaid, scott] = verifiedTestimonials

  return (
    <section ref={root} aria-label="About" className="container-x pb-12 pt-32 lg:pb-16 lg:pt-40">
      <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="min-w-0">
          <div className="hero-in flex flex-wrap gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-[13px] font-semibold">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#34c759] opacity-60 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-[#34c759]" />
              </span>
              Open to a Spring/Summer 2027 co-op · Mar – Aug
            </p>
            <button
              onClick={() => scrollTo("build-agentguard")}
              className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:border-foreground/20"
            >
              <img src={logos.paypal} alt="" className="size-3.5" />
              New: AgentGuard, for the PayPal AI Hackathon
              <ArrowDown className="size-3.5 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          <h1 className="hero-in display-lg mt-7">{profile.name}</h1>
          <p className="hero-in mt-5 max-w-xl text-pretty text-[22px] leading-snug text-foreground/70 md:text-[26px]">
            Software engineer. I build AI products end to end, <span className="text-foreground">and design them with taste.</span>
          </p>
          <p className="hero-in mt-4 text-[15px] text-muted-foreground">Drexel · B.S. Software Engineering · 2028 · {profile.location}</p>

          <div className="hero-in mt-8 flex flex-wrap gap-2.5">
            <a
              href={profile.links.resume}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-colors hover:bg-foreground/85"
            >
              <Download className="size-4" /> Resume
            </a>
            <Pill href={profile.links.linkedin} icon={<BrandIcon name="linkedin" className="text-[#0a66c2]" />}>LinkedIn</Pill>
            <Pill href={profile.links.github} icon={<BrandIcon name="github" />}>GitHub</Pill>
            <Pill to="/contact#book" icon={<CalendarDays className="size-4" />}>Book a call</Pill>
          </div>

          <button onClick={() => scrollTo("recs")} className="hero-in group mt-10 flex items-center gap-4 text-left">
            <span className="flex shrink-0 -space-x-2">
              {[junaid, scott].map((t) => (
                <span key={t.id} className="grid size-10 place-items-center rounded-full bg-foreground text-[12px] font-semibold text-background ring-[3px] ring-[#fbfbfc]">
                  {t.initials}
                </span>
              ))}
            </span>
            <span className="text-[14px] leading-snug text-muted-foreground">
              Recommended on <BrandIcon name="linkedin" className="mb-0.5 size-3.5 align-middle text-[#0a66c2]" /> LinkedIn by{" "}
              <span className="font-semibold text-foreground">{junaid.name}</span>, my manager, and{" "}
              <span className="font-semibold text-foreground">{scott.name}</span>, Executive Director
              <ArrowDown className="ml-1 inline size-3.5 transition-transform group-hover:translate-y-0.5" />
            </span>
          </button>
        </div>

        <ExperiencePanel />
      </div>
    </section>
  )
}

function Pill({ href, to, icon, children }: { href?: string; to?: string; icon: ReactNode; children: ReactNode }) {
  const cls = "inline-flex h-12 items-center gap-2 rounded-full border border-foreground/10 bg-white px-5 text-[15px] font-semibold transition-colors hover:border-foreground/25"
  return to ? (
    <Link to={to} className={cls}>
      {icon}
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {icon}
      {children}
    </a>
  )
}

/** Experience as a resume block, with the certifications along the bottom. */
function ExperiencePanel() {
  return (
    <div className="hero-panel overflow-hidden rounded-3xl border border-hairline bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_40px_80px_-50px_rgb(0_0_0/0.35)]">
      <p className="eyebrow px-6 pb-2 pt-5">Experience</p>
      <ul className="divide-y divide-hairline">
        {experience.map((e) => (
          <ExperienceRow key={e.org} e={e} />
        ))}
      </ul>
      <div className="border-t border-hairline bg-[#f7f7f8] px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            <img src={logos.microsoft} alt="" className="size-4" /> Microsoft Certified
          </p>
          <a
            href={`${profile.links.linkedin}details/certifications/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Verify <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {certs.map((c) => (
            <li key={c.code} className="rounded-xl border border-hairline bg-white px-3 py-2">
              <p className="text-[14px] font-semibold">{c.code}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{c.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ExperienceRow({ e }: { e: Experience }) {
  const [open, setOpen] = useState(false)
  const body = (
    <>
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-black/[0.07]">
        {e.logo ? <img src={e.logo} alt="" className="max-h-full max-w-full" /> : <span className="text-[16px] font-semibold">{e.org[0]}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-tight">{e.org}</span>
        <span className="block text-[13px] leading-snug text-muted-foreground">
          {e.role} · {e.period}
        </span>
        {e.note && <span className="block text-[13px] font-medium leading-snug text-foreground/75 sm:hidden">{e.note}</span>}
      </span>
      {e.note && <span className="hidden text-right text-[13px] font-medium text-foreground/75 sm:block">{e.note}</span>}
    </>
  )
  const row = "flex w-full items-center gap-4 px-6 py-4 text-left transition-colors"

  if (e.work) {
    const w = e.work
    return (
      <li>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn(row, "hover:bg-foreground/[0.025]")}>
          {body}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline px-2.5 py-1 text-[12px] font-semibold">
            What I built <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
          </span>
        </button>
        <div className={cn("grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden" inert={!open}>
            <div className="px-6 pb-6 sm:pl-[84px]">
              <p className="text-[15px] font-semibold">
                {w.title} <span className="font-normal text-muted-foreground">· {w.line}</span>
              </p>
              <ul className="mt-3 space-y-2">
                {w.points.slice(0, 3).map((p) => (
                  <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground/80">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Lock className="size-3" /> {w.note}
              </p>
            </div>
          </div>
        </div>
      </li>
    )
  }
  return (
    <li>
      {e.href ? (
        <a href={e.href} target="_blank" rel="noreferrer" className={cn(row, "hover:bg-foreground/[0.025]")}>
          {body}
          <ArrowUpRight className="size-4 shrink-0 text-dim" />
        </a>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  )
}

function Recommendations({ onOpen }: { onOpen: (t: Testimonial) => void }) {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".rec-in", { y: 50, autoAlpha: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
    },
    { scope: root },
  )
  const first = verifiedTestimonials[0]?.source
  return (
    <section ref={root} id="recs" aria-labelledby="recs-title" className="container-x scroll-mt-28 pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="rec-in eyebrow">Recommendations</p>
          <h2 id="recs-title" className="rec-in display-md mt-4">
            Recommended by Comcast leadership.
          </h2>
        </div>
        <a
          href={first?.kind === "linkedin" ? first.href : profile.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="rec-in inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Both are public on my LinkedIn <ArrowUpRight className="size-3.5" />
        </a>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {verifiedTestimonials.map((t) => (
          <RecCard key={t.id} t={t} onOpen={() => onOpen(t)} />
        ))}
      </div>
    </section>
  )
}

function RecCard({ t, onOpen }: { t: Testimonial; onOpen: () => void }) {
  if (t.source.kind !== "linkedin") return null
  const r = t.source.receipt
  return (
    <article className="rec-in flex flex-col rounded-3xl border border-hairline bg-white p-7 md:p-8">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-[13px] font-semibold text-background">
          {t.initials}
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-tight">{t.name}</p>
          <p className="text-[13px] leading-snug text-muted-foreground">
            {t.shortTitle.split(",")[0]}, Comcast{t.relationship && <> · {t.relationship}</>}
          </p>
        </div>
      </div>

      <blockquote className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.025em] md:text-[32px]">“{t.pull}”</blockquote>

      <button
        onClick={onOpen}
        style={{ aspectRatio: `${r.width} / ${r.height}` }}
        className="group relative mt-6 block w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.08]"
        aria-label={`Read in full: ${r.alt}`}
      >
        <img src={r.src} alt={r.alt} width={r.width} height={r.height} loading="lazy" className="size-full object-contain object-top" />
        <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/25">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-black opacity-0 shadow transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-3.5" /> Read in full
          </span>
        </span>
      </button>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">{t.date}</span>
        <a
          href={t.source.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 px-4 text-[13px] font-semibold transition-colors hover:border-foreground/30"
        >
          <BrandIcon name="linkedin" className="size-3.5 text-[#0a66c2]" /> Verify on LinkedIn
        </a>
      </div>
    </article>
  )
}

const EXPLORE = [
  { to: "/work", icon: LayoutGrid, title: "All work", text: "Every project, with the full write-ups." },
  { to: "/studio", icon: Aperture, title: "Studio", text: "Photography, and the music I release as Azrael." },
  { to: "/contact", icon: Mail, title: "Contact", text: "Send a message or book a 30-minute call." },
  { to: "/", icon: Home, title: "Full site", text: "The rest of my portfolio, with all the motion." },
]

function Explore() {
  return (
    <section aria-labelledby="explore-title" className="container-x py-20 md:py-28">
      <h2 id="explore-title" className="display-md">
        Keep exploring
      </h2>
      <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {EXPLORE.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="group flex flex-col gap-10 bg-white p-6 transition-colors hover:bg-[#f7f7f8]">
            <span className="grid size-11 place-items-center rounded-xl bg-foreground/[0.05]">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="flex items-center justify-between text-xl font-semibold tracking-tight">
                {title} <ArrowUpRight className="size-4 text-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
              <span className="mt-2 block text-[14px] leading-relaxed text-muted-foreground">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
