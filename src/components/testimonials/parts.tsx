import { Fragment } from "react"
import { ArrowUpRight, BadgeCheck, MessageSquareText } from "lucide-react"
import type { Testimonial } from "@/content/testimonials"
import { BrandIcon } from "@/components/BrandIcon"
import { cn } from "@/lib/utils"

/** Says up front where the words come from, so nobody has to guess. */
export function SourceBadge({ t }: { t: Testimonial }) {
  return t.source.kind === "linkedin" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2]/[0.08] px-3 py-1 text-[12px] font-semibold text-[#0a66c2]">
      <BadgeCheck className="size-3.5" /> Verified on LinkedIn
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-[12px] font-semibold text-muted-foreground">
      <MessageSquareText className="size-3.5" /> Team message · shown as sent
    </span>
  )
}

/** Link to the recommendation on LinkedIn, or open the original message screenshot. */
export function SourceAction({ t, onOpen }: { t: Testimonial; onOpen: () => void }) {
  const cls =
    "inline-flex h-10 items-center gap-2 rounded-full border border-hairline px-4 text-[13px] font-semibold transition-colors hover:bg-foreground/5"
  return t.source.kind === "linkedin" ? (
    <a href={t.source.href} target="_blank" rel="noreferrer" className={cls}>
      <BrandIcon name="linkedin" className="size-3.5" /> See it on LinkedIn <ArrowUpRight className="size-3.5 text-dim" />
    </a>
  ) : (
    <button onClick={onOpen} className={cls}>
      <MessageSquareText className="size-3.5" /> View original message
    </button>
  )
}

/** Name (linked to their LinkedIn when we have it) and title. */
export function PersonName({ t, className }: { t: Testimonial; className?: string }) {
  return t.profile ? (
    <a href={t.profile} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline", className)}>
      {t.name}
      <BrandIcon name="linkedin" className="size-3 text-[#0a66c2]" />
      <span className="sr-only">(LinkedIn profile)</span>
    </a>
  ) : (
    <span className={cn("font-semibold", className)}>{t.name}</span>
  )
}

export function Attribution({ t }: { t: Testimonial }) {
  return (
    <figcaption className="flex items-center gap-3.5">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-[13px] font-semibold text-background">
        {t.initials}
      </span>
      <span className="min-w-0">
        <PersonName t={t} className="block text-[15px] tracking-tight" />
        <span className="block text-[13px] leading-snug text-muted-foreground">{t.title}</span>
      </span>
    </figcaption>
  )
}

/**
 * The quote, one span per word so it can light up as you scroll. The `highlight` phrase gets
 * the accent gradient. Words render at full strength until an animation dims them.
 */
export function QuoteWords({ t }: { t: Testimonial }) {
  const from = t.quote.indexOf(t.highlight)
  const to = from < 0 ? -1 : from + t.highlight.length
  // Split on whitespace only, so punctuation stays glued to its word; a word the highlight
  // starts or ends inside ("production,") is split into a hot and a plain piece.
  const words = [...t.quote.matchAll(/\S+/g)].map((m) => {
    const start = m.index
    const end = start + m[0].length
    const cut = (a: number, b: number) => {
      const s = Math.max(a, start)
      const e = Math.min(b, end)
      return e > s ? m[0].slice(s - start, e - start) : ""
    }
    return from < 0 || end <= from || start >= to
      ? [{ text: m[0], hot: false }]
      : [
          { text: cut(start, from), hot: false },
          { text: cut(from, to), hot: true },
          { text: cut(to, end), hot: false },
        ].filter((p) => p.text)
  })
  return (
    <>
      {words.map((pieces, i) => (
        <Fragment key={i}>
          <span className="t-word">
            {pieces.map((p, j) => (
              <span key={j} className={cn(p.hot && "text-ember-grad")}>
                {p.text}
              </span>
            ))}
          </span>{" "}
        </Fragment>
      ))}
    </>
  )
}

/**
 * The original screenshot as a physical card: a matted print with a strip of tape, tilted by
 * the scroll animation. Click to read it full size.
 */
export function ReceiptCard({ t, onOpen, className }: { t: Testimonial; onOpen: () => void; className?: string }) {
  const r = t.source.receipt
  const where = t.source.kind === "linkedin" ? "LinkedIn" : "Microsoft Teams"
  return (
    <button onClick={onOpen} className={cn("t-receipt group relative block w-full text-left will-change-transform", className)} aria-label={`Open the original: ${r.alt}`}>
      <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-[2px] bg-white/70 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm" />
      <span
        className={cn(
          "block rounded-[14px] p-2.5 shadow-[0_2px_4px_rgb(0_0_0/0.06),0_30px_70px_-24px_rgb(0_0_0/0.45)] ring-1 ring-black/[0.06] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.02]",
          r.dark ? "bg-[#1f1f1f]" : "bg-white",
        )}
      >
        <img src={r.src} alt={r.alt} width={r.width} height={r.height} loading="lazy" decoding="async" className="block h-auto w-full rounded-[8px]" />
        <span className={cn("mt-2.5 flex items-center justify-between px-1 pb-0.5 font-mono text-[10px] uppercase tracking-[0.18em]", r.dark ? "text-white/45" : "text-[#6e6e73]")}>
          <span>Original · {where}</span>
          <span className={cn("inline-flex items-center gap-1 transition-colors", r.dark ? "group-hover:text-white" : "group-hover:text-[#1d1d1f]")}>
            Open <ArrowUpRight className="size-3" />
          </span>
        </span>
      </span>
    </button>
  )
}
