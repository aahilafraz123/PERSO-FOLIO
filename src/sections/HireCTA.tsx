import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { profile } from "@/content/profile"
import { RevealText } from "@/motion/RevealText"
import { Magnetic } from "@/motion/Magnetic"

export function HireCTA() {
  return (
    <section className="theme-light tone-mist relative overflow-hidden py-32 md:py-48">
      <div aria-hidden className="absolute left-1/2 top-full size-[90vmax] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgb(255_107_44/0.16),transparent_60%)]" />
      <div className="container-x relative">
        <RevealText as="h2" split="lines" className="display-lg max-w-6xl text-balance">
          Freelance work
        </RevealText>
        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
          <p className="max-w-md text-lg text-muted-foreground">
            I take on a few freelance projects at a time. Send me what you're working on and I'll tell you if I can help.
          </p>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {profile.services.map((s) => (
              <li key={s.title} className="group flex items-baseline justify-between gap-6 py-6 transition-[padding] duration-500 hover:pl-3">
                <span className="text-xl font-semibold tracking-tight md:text-2xl">{s.title}</span>
                <span className="max-w-[16rem] text-right text-sm text-muted-foreground">{s.body}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-24 flex flex-col items-center text-center md:mt-32">
          <Magnetic padding={80} strength={0.3}>
            <Link
              to="/contact"
              className="group relative grid size-48 place-items-center rounded-full bg-foreground text-background transition-transform duration-700 hover:scale-105 md:size-60"
            >
              <span className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
                Start a project <ArrowUpRight className="size-6 transition-transform duration-500 group-hover:rotate-45" />
              </span>
            </Link>
          </Magnetic>
          <p className="mt-8 text-sm text-muted-foreground">Or book a 30-minute call. I usually reply within a day.</p>
        </div>
      </div>
    </section>
  )
}
