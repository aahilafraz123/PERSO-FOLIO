import { useRef } from "react"
import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { logos } from "@/components/logos"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** A sentence in parts; `em` parts are the numbers, highlighted. */
type Part = string | { em: string }
type Result = { slug: string; source: string; logo?: string; cta: string; parts: Part[] }

const results: Result[] = [
  {
    slug: "aircast",
    source: "NASA Space Apps Challenge 2025",
    logo: logos.nasa,
    cta: "See AirCast and the NASA email",
    parts: ["My team's air-quality app was named a NASA Global Nominee: one of ", { em: "1,290" }, " picked from ", { em: "11,500+" }, " projects worldwide. We built it in a weekend."],
  },
  {
    slug: "security-analytics",
    source: "Comcast · Software Engineering Co-op",
    logo: logos.comcast,
    cta: "See the security platform",
    parts: ["At Comcast I built one security view that replaces ", { em: "5+" }, " dashboards for engineering leaders. It ships inside the developer portal ", { em: "30,000+" }, " engineers use."],
  },
  {
    slug: "learnflow",
    source: "LearnFlow · Co-founder",
    cta: "See LearnFlow",
    parts: [{ em: "150+" }, " people signed up for the beta of LearnFlow, the AI study app I co-founded and built."],
  },

]

/** Split into word spans so each word can scrub in on its own. */
function Words({ parts }: { parts: Part[] }) {
  return parts.flatMap((part, i) => {
    const em = typeof part !== "string"
    const text = em ? part.em : part
    return text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((w, j) => (/^\s+$/.test(w) ? w : <span key={`${i}-${j}`} className={em ? "pw text-ember-grad" : "pw"}>{w}</span>))
  })
}

/** The headline numbers, each in a full sentence a person can actually read. */
export function PlainWords() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>(".pw-item").forEach((item) => {
        gsap.fromTo(
          item.querySelectorAll(".pw"),
          { opacity: 0.14 },
          { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: item, start: "top 80%", end: "bottom 55%", scrub: 0.5 } },
        )
        gsap.from(item.querySelectorAll(".pw-meta"), { y: 16, opacity: 0, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: item, start: "top 82%", once: true } })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} aria-labelledby="plain-words" className="theme-light tone-mist">
      <div className="container-x grid gap-14 py-32 md:py-44 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <h2 id="plain-words" className="display-md">
            In plain words
          </h2>
          <p className="mt-5 max-w-sm text-lg text-muted-foreground">The results worth knowing, each one in a sentence, with the proof one click away.</p>
        </div>

        <ol className="divide-y divide-hairline">
          {results.map((r) => (
            <li key={r.slug} className="pw-item py-12 first:pt-0 last:pb-0 md:py-16">
              <p className="pw-meta mb-5 flex items-center gap-3">
                {r.logo ? <img src={r.logo} alt="" className="logo-ink h-6 w-auto opacity-70" /> : <span className="size-2 rounded-full bg-ember" />}
                <span className="font-mono text-[13px] uppercase tracking-[0.22em] text-muted-foreground">{r.source}</span>
              </p>
              <p className="text-balance text-3xl font-semibold leading-[1.12] tracking-tight md:text-[2.75rem]">
                <Words parts={r.parts} />
              </p>
              <Link
                to={`/work/${r.slug}`}
                className="pw-meta group mt-7 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {r.cta} <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
