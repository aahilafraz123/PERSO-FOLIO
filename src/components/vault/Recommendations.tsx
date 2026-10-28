import { useRef, useState } from "react"
import { ArrowUpRight, Maximize2 } from "lucide-react"
import { profile } from "@/content/profile"
import { verifiedTestimonials, type Testimonial } from "@/content/testimonials"
import { BrandIcon } from "@/components/BrandIcon"
import { ProofLightbox } from "@/components/work/EmailView"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** The two LinkedIn recommendations, each with the original screenshot and a link to verify it. */
export function Recommendations() {
  const root = useRef<HTMLElement>(null)
  const [proof, setProof] = useState<Testimonial | null>(null)
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
          <RecCard key={t.id} t={t} onOpen={() => setProof(t)} />
        ))}
      </div>
      <ProofLightbox receipt={proof?.source.receipt ?? null} onClose={() => setProof(null)} />
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
