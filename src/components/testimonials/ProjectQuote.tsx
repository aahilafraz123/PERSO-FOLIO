import { useState } from "react"
import type { Testimonial } from "@/content/testimonials"
import { ProofLightbox } from "@/components/work/EmailView"
import { Attribution, SourceAction, SourceBadge } from "./parts"

/** Compact quote for a project write-up: the pull quote, who said it, and where to check. */
export function ProjectQuote({ t }: { t: Testimonial }) {
  const [proof, setProof] = useState(false)
  return (
    <figure className="rounded-[20px] bg-[#f5f5f7] p-6 md:p-8">
      <SourceBadge t={t} />
      <blockquote className="mt-5 text-pretty text-lg font-semibold leading-snug tracking-tight md:text-xl">
        <span aria-hidden className="text-dim">“</span>
        {t.quote}
        <span aria-hidden className="text-dim">”</span>
      </blockquote>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Attribution t={t} />
        <SourceAction t={t} onOpen={() => setProof(true)} />
      </div>
      <ProofLightbox receipt={proof ? t.source.receipt : null} onClose={() => setProof(false)} />
    </figure>
  )
}
