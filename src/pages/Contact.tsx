import { useRef } from "react"
import { Link } from "react-router"
import { ArrowUpRight, BadgeCheck, Download } from "lucide-react"
import { RevealText } from "@/motion/RevealText"
import { ContactForm } from "@/components/contact/ContactForm"
import { Booking } from "@/components/contact/Booking"
import { BrandIcon } from "@/components/BrandIcon"
import { profile } from "@/content/profile"
import { testimonials } from "@/content/testimonials"
import { usePageMeta } from "@/hooks/usePageMeta"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { Caustics } from "@/sections/Caustics"

const scott = testimonials.find((t) => t.id === "scott-adams")

export default function Contact() {
  usePageMeta("Contact — Aahil Afraz", "Hire Aahil Afraz for design and engineering work, or book a call.")
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".contact-quote", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: ".contact-quote", start: "top 88%", once: true },
      })
    },
    { scope: root },
  )

  return (
    <main ref={root} className="theme-light relative isolate w-full max-w-full overflow-x-clip">
      {/* Ambient backdrop for the whole page, sticking inside it rather than fixed, so it ends where the page does. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="sticky top-0 h-svh">
          <Caustics />
        </div>
      </div>

      <section className="pb-16 pt-40 md:pt-48">
        <div className="container-x">
          <RevealText as="h1" split="words" immediate delay={0.3} className="display-xl max-w-6xl text-balance">
            Contact
          </RevealText>
          <p className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
            For freelance work, internships and full-time roles, or questions about my projects. Send a message or book a call.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
              <BrandIcon name="linkedin" /> LinkedIn <ArrowUpRight className="size-3.5 text-dim" />
            </a>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
              <BrandIcon name="github" /> GitHub <ArrowUpRight className="size-3.5 text-dim" />
            </a>
            <a href={profile.links.resume} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
              <Download className="size-4" /> Resume
            </a>
            <Link to="/vault" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
              <BadgeCheck className="size-4" /> Recruiter overview
            </Link>
          </div>
        </div>
      </section>

      {/* Message: heading left, form right. */}
      <section className="container-x grid gap-10 pb-24 pt-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <h2 className="display-md">Send a message</h2>
          <p className="mt-4 max-w-sm text-muted-foreground">Tell me what you're working on. I usually reply within a day.</p>
          {scott && scott.source.kind === "linkedin" && (
            <figure className="contact-quote mt-12 max-w-sm border-l-2 border-foreground pl-5">
              <blockquote className="text-xl font-semibold tracking-tight">“Aahil has what it takes.”</blockquote>
              <figcaption className="mt-2 text-[13px] leading-snug text-muted-foreground">
                {scott.name}, Executive Director, Comcast ·{" "}
                <a href={scott.source.href} target="_blank" rel="noreferrer" className="font-medium text-[#0a66c2] underline-offset-4 hover:underline">
                  LinkedIn recommendation
                </a>
              </figcaption>
            </figure>
          )}
        </div>
        <div className="relative">
          <ContactForm />
        </div>
      </section>

      {/* Booking gets the full width: Cal.com's month view needs ~800px to lay out properly. */}
      <section id="book" className="container-x scroll-mt-24 border-t border-hairline pb-32 pt-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="display-md">Book a call</h2>
          <p className="max-w-sm text-muted-foreground">30 minutes on video. Pick any open slot.</p>
        </div>
        <Booking />
      </section>
    </main>
  )
}
