import { useRef, type ReactNode } from "react"
import { Download } from "lucide-react"
import { profile } from "@/content/profile"
import { allBuilds } from "@/content/vault"
import { BrandIcon } from "@/components/BrandIcon"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/** A plain opening, in the recruiter page's style: what's here, and the resume and profiles. */
export function WorkHero() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".wh-in", { y: 30, autoAlpha: 0, stagger: 0.06, duration: 1, delay: 0.1 })
    },
    { scope: root },
  )

  return (
    <section ref={root} aria-label="Work" className="container-x pb-4 pt-32 lg:pt-40">
      <p className="wh-in eyebrow">Work</p>
      <h1 className="wh-in display-lg mt-5 max-w-4xl text-balance">What I've built, and what happened next.</h1>
      <p className="wh-in mt-6 max-w-2xl text-pretty text-[19px] leading-relaxed text-foreground/70 md:text-[21px]">
        {allBuilds.length} projects, from PayPal and NASA hackathons to security tooling at Comcast. Each card has the results, how it works and the
        code. Open the full write-up for the whole story.
      </p>
      <div className="wh-in mt-8 flex flex-wrap gap-2.5">
        <a
          href={profile.links.resume}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-colors hover:bg-foreground/85"
        >
          <Download className="size-4" /> Resume
        </a>
        <Pill href={profile.links.github} icon={<BrandIcon name="github" />}>
          GitHub
        </Pill>
        <Pill href={profile.links.linkedin} icon={<BrandIcon name="linkedin" className="text-[#0a66c2]" />}>
          LinkedIn
        </Pill>
      </div>
    </section>
  )
}

function Pill({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-12 items-center gap-2 rounded-full border border-foreground/10 bg-white px-5 text-[15px] font-semibold transition-colors hover:border-foreground/25"
    >
      {icon}
      {children}
    </a>
  )
}
