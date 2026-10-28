import { useRef } from "react"
import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import CountUp from "@/components/bits/CountUp"
import { RevealText } from "@/motion/RevealText"
import { TiltCard } from "@/motion/TiltCard"
import { gsap, useGSAP } from "@/motion/gsap"
import { DotField } from "./DotField"
import { logos } from "@/components/logos"
import { cn } from "@/lib/utils"

function Card({ className, children, to, href }: { className?: string; children: React.ReactNode; to?: string; href?: string }) {
  const cls = cn("win-card group block rounded-[28px] focus-visible:outline-offset-4", className)
  const inner = (
      <TiltCard max={5} className="overflow-hidden rounded-[28px] border border-hairline bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_40px_-12px_rgb(0_0_0/0.12)]">
        {children}
        <ArrowUpRight className="absolute right-6 top-6 size-5 text-dim transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </TiltCard>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={to!} className={cls}>
      {inner}
    </Link>
  )
}

export function Wins() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from(".win-card", {
        y: 80,
        opacity: 0,
        rotateX: 12,
        transformOrigin: "50% 100%",
        stagger: 0.07,
        duration: 1,
        scrollTrigger: { trigger: ".win-grid", start: "top 80%", once: true },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="theme-light tone-mist">
      <div className="container-x py-32 md:py-48">
      <div className="mb-16 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end">
        <RevealText as="h2" split="lines" className="display-lg max-w-5xl text-balance">
          Highlights
        </RevealText>
        <Link to="/work" className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          Every project <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 6 columns: NASA 4x2 + Comcast 2x1 + LearnFlow 2x1 fill rows 1-2; row 3 is 3 + 3. No voids. */}
      <div className="win-grid perspective grid grid-flow-dense auto-rows-[minmax(260px,auto)] grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
        <Card to="/work/aircast" className="theme-dark !bg-transparent md:col-span-4 md:row-span-2">
          <div className="relative flex h-full min-h-[520px] flex-col justify-between p-7 md:p-10">
            <div className="absolute inset-0 opacity-90 transition-opacity duration-700 group-hover:opacity-100">
              <DotField className="absolute inset-x-7 top-24 h-[calc(100%-17rem)] w-[calc(100%-3.5rem)] md:inset-x-10 md:w-[calc(100%-5rem)]" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-card via-card/90 to-transparent" />
            </div>
            <div className="relative flex items-center gap-3">
              <img src={logos.nasa} alt="" className="logo-ink h-7 w-auto" />
              <span className="eyebrow">Space Apps Challenge 2025</span>
            </div>
            <div className="relative mt-auto">
              <p className="display-lg leading-none">
                <span className="text-ember-grad">Top 1,290</span>
              </p>
              <p className="mt-3 max-w-md text-lg text-pretty text-foreground/90 md:text-xl">
                Global Nominee out of{" "}
                <CountUp to={11500} separator="," duration={2.2} className="font-semibold tabular-nums text-foreground" />+ teams
                worldwide, for AirCast.
              </p>
            </div>
          </div>
        </Card>

        <Card to="/work/security-analytics" className="md:col-span-2">
          <div className="relative flex h-full flex-col justify-between bg-[radial-gradient(120%_80%_at_100%_0%,rgb(255_107_44/0.14),transparent_60%)] p-7">
            <img src={logos.comcast} alt="Comcast" className="logo-ink h-9 w-auto self-start" />
            <div>
              <p className="eyebrow mb-2">SWE Co-op · Mar – Sep 2026</p>
              <p className="text-2xl font-semibold leading-tight tracking-tight">Built a security analytics platform for engineering leaders.</p>
            </div>
          </div>
        </Card>

        <Card to="/work/learnflow" className="md:col-span-2">
          <div className="relative flex h-full flex-col justify-between bg-[radial-gradient(120%_80%_at_0%_100%,rgb(52_199_89/0.12),transparent_60%)] p-7">
            <p className="eyebrow">LearnFlow · Founding engineer</p>
            <div>
              <p className="text-7xl font-semibold tracking-tighter tabular-nums">
                <CountUp to={150} duration={1.6} />+
              </p>
              <p className="mt-2 text-lg text-muted-foreground">beta users on LearnFlow, the AI learning platform I founded and launched.</p>
            </div>
          </div>
        </Card>

        <Card to="/work/aircast" className="md:col-span-3">
          <div className="relative flex h-full items-end justify-between gap-6 p-7">
            <div>
              <p className="eyebrow mb-3">AirCast</p>
              <p className="text-2xl font-semibold leading-tight tracking-tight">Built and deployed on Azure in one weekend.</p>
            </div>
            <p className="text-[5.5rem] font-semibold leading-none tracking-tighter text-titanium">48h</p>
          </div>
        </Card>

        <Card href="https://zarohealth.com/" className="md:col-span-3">
          <div className="relative flex h-full items-end justify-between gap-6 p-7">
            <div>
              <p className="eyebrow mb-3">Now</p>
              <p className="text-2xl font-semibold leading-tight tracking-tight">Software engineer at Zaro Health since August 2026.</p>
              <p className="mt-2 text-sm text-muted-foreground">zarohealth.com</p>
            </div>
            <p className="shrink-0 whitespace-nowrap text-[3.5rem] font-semibold leading-none tracking-tighter text-titanium">Zaro</p>
          </div>
        </Card>
      </div>
      </div>
    </section>
  )
}
