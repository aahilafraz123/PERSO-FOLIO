import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { ArrowUpRight, FileText } from "lucide-react"
import { projects, type Project } from "@/content/projects"
import { RevealText } from "@/motion/RevealText"
import { useLenis } from "@/motion/SmoothScroll"
import { ProofLightbox } from "@/components/work/EmailView"
import { StackList } from "@/components/work/StackList"
import { cn } from "@/lib/utils"

const featured = projects.filter((p) => p.featured)

/**
 * Sticky index on the left, readable project write-ups on the right.
 * The index tracks which project you're reading; click to jump.
 */
export function SelectedWork() {
  const [active, setActive] = useState(0)
  const [proof, setProof] = useState<Project | null>(null)
  const items = useRef<(HTMLElement | null)[]>([])
  const lenis = useLenis()

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
        })
      },
      { rootMargin: "-45% 0px -45% 0px" },
    )
    items.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const jump = (i: number) => {
    const el = items.current[i]
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="theme-light">
      <div className="container-x grid gap-12 py-32 md:py-48 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        {/* Index */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <RevealText as="h2" split="lines" className="display-lg">
            Selected work
          </RevealText>
          <ol className="mt-10 hidden border-l border-hairline lg:block">
            {featured.map((p, i) => (
              <li key={p.slug}>
                <button
                  onClick={() => jump(i)}
                  className={cn(
                    "relative -ml-px block w-full border-l-2 py-3 pl-5 text-left transition-colors duration-300",
                    active === i ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block text-lg font-semibold tracking-tight">{p.title}</span>
                  <span className="block text-sm">{p.org}</span>
                </button>
              </li>
            ))}
          </ol>
          <Link to="/work" className="mt-10 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            All projects <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {/* Write-ups */}
        <div className="divide-y divide-hairline">
          {featured.map((p, i) => (
            <article
              key={p.slug}
              ref={(el) => {
                items.current[i] = el
              }}
              data-i={i}
              className="py-14 first:pt-0 last:pb-0 md:py-20"
            >
              <p className="text-sm text-muted-foreground">
                {p.org} · {p.period}
              </p>
              <h3 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{p.title}</h3>
              <p className="mt-4 max-w-2xl text-xl leading-snug text-foreground/85 md:text-2xl">{p.headline}</p>

              <ul className="mt-10 grid grid-cols-3 gap-6 rounded-[20px] bg-[#f5f5f7] p-6 md:p-8">
                {p.metrics.map((m) => (
                  <li key={m.label}>
                    <p className="text-2xl font-semibold tracking-tight md:text-4xl">{m.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-10 max-w-2xl text-lg leading-relaxed text-foreground/80">{p.summary}</p>

              <div className="mt-10 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="eyebrow mb-3">What I did</p>
                  <p className="leading-relaxed text-foreground/80">{p.role}</p>
                </div>
                <div>
                  <p className="eyebrow mb-3">Built with</p>
                  <StackList items={p.stack} />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link to={`/work/${p.slug}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
                  Full details <ArrowUpRight className="size-4" />
                </Link>
                {p.receipt && (
                  <button
                    onClick={() => setProof(p)}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5"
                  >
                    <FileText className="size-4" /> {p.slug === "aircast" ? "View the NASA email" : "View the offer email"}
                  </button>
                )}
                {p.links
                  ?.filter((l) => l.href.includes("github.com"))
                  .map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
                      Code <ArrowUpRight className="size-4" />
                    </a>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <ProofLightbox receipt={proof?.receipt ?? null} onClose={() => setProof(null)} />
    </section>
  )
}
