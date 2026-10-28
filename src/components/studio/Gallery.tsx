import { lazy, Suspense, useRef, useState, type CSSProperties } from "react"
import { chapters, gallery, galleryChapter, type Frame, type Row } from "@/content/photos"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { reel, reelStart } from "@/components/studio/reel"

// The shared viewer (morph between photos, each at its own shape, on black with a faint wash of
// the photo's colour). Its own chunk, fetched as soon as a pointer reaches a photo.
const loadLightbox = () => import("@/components/PhotoLightbox")
const PhotoLightbox = lazy(loadLightbox)

function Img({ frame, className, style, full = false }: { frame: Frame; className?: string; style?: CSSProperties; full?: boolean }) {
  return (
    <img
      src={full ? frame.src : frame.thumb}
      width={frame.w}
      height={frame.h}
      alt={frame.caption ?? ""}
      loading={full ? "eager" : "lazy"}
      decoding="async"
      style={style}
      className={className}
    />
  )
}

export function Gallery() {
  // Index into the flat reel (series expand to one photo per frame), not into `gallery`.
  const [open, setOpen] = useState<number | null>(null)
  // Stays mounted after the first open so the viewer can animate out.
  const [viewer, setViewer] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const view = (entry: number) => {
    setViewer(true)
    setOpen(reelStart[entry])
  }

  useGSAP(
    () => {
      // The chapter index follows along: whichever chapter crosses the middle of the screen is current.
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: "top center", end: "bottom center", onToggle: (self) => self.isActive && setActive(i) })
      })
      if (prefersReducedMotion()) return
      // Rows settle into place as they rise into view. One tween per row, tied to scroll
      // position, so scrolling back up simply plays it in reverse: no competing triggers.
      gsap.utils.toArray<HTMLElement>(".ph").forEach((el) => {
        gsap.fromTo(el, { scale: 0.94, opacity: 0.4 }, {
          scale: 1, opacity: 1, ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 70%", scrub: 0.4 },
        })
      })
    },
    { scope: root },
  )

  if (!gallery.length) return null

  const row = (row: Row) =>
    row.kind === "row" ? (
      <div key={`r-${row.tiles[0].index}`} className="ph flex flex-wrap gap-3 sm:flex-nowrap md:gap-4">
        {row.tiles.map((t, i, all) => {
          // Phones: in a trio, the widest photo takes the full width first; the other two pair below.
          // A strip of four portraits becomes two by two.
          const lead = all.length === 3 && all.every((o) => o.aspect <= t.aspect) && all.findIndex((o) => o.aspect === t.aspect) === i
          const basis = lead ? "order-first basis-full sm:order-none sm:basis-0" : all.length === 4 ? "basis-[calc(50%-0.375rem)] sm:basis-0" : "basis-0"
          return (
            <button
              key={t.frame.name}
              data-ambient={t.frame.name}
              onPointerEnter={loadLightbox}
              onFocus={loadLightbox}
              onClick={() => view(t.index)}
              style={{ flexGrow: t.aspect, aspectRatio: t.aspect }}
              className={`group relative min-w-0 overflow-hidden rounded-[14px] bg-[#111113] ${basis}`}
              aria-label={`Open photo${t.frame.caption ? `: ${t.frame.caption}` : ""}, ${galleryChapter[t.index]}`}
            >
              <Img
                frame={t.frame}
                style={t.focus ? { objectPosition: t.focus } : undefined}
                className="size-full object-cover brightness-[0.94] transition-[transform,filter] duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.035] group-hover:brightness-105"
              />
              {t.frame.caption && (
                <span className="absolute bottom-3 left-3 translate-y-2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {t.frame.caption}
                </span>
              )}
            </button>
          )
        })}
      </div>
    ) : (
      <figure key={`x-${row.entry.key}`} className="ph" data-ambient={row.entry.frames[0].name}>
        <button
          onPointerEnter={loadLightbox}
          onFocus={loadLightbox}
          onClick={() => view(row.index)}
          className="group block w-full overflow-hidden rounded-[14px] bg-[#111113] text-left"
          aria-label={`Open series${row.entry.title ? ` ${row.entry.title}` : ""}, ${row.entry.frames.length} frames`}
        >
          {/* Frames sit edge to edge so the composition continues across seams. Swipes on phones.
              No data-lenis-prevent: Lenis leaves touch alone, and on desktop it made the wheel stick here. */}
          <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:overflow-visible [&::-webkit-scrollbar]:hidden">
            {row.entry.frames.map((f) => (
              <Img
                key={f.name}
                frame={f}
                className="aspect-square w-[88vw] shrink-0 snap-start object-cover brightness-[0.94] transition-[filter] duration-700 group-hover:brightness-105 md:w-auto md:min-w-0 md:flex-1"
              />
            ))}
          </div>
        </button>
        <figcaption className="mt-3 flex items-center justify-between px-1 text-xs text-muted-foreground md:hidden">
          <span>Swipe</span>
          <span>{row.entry.frames.length} frames</span>
        </figcaption>
      </figure>
    )

  return (
    <>
      <div ref={root} className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        {/* Chapter index: phones get a row of chips, desktop a rail that stays put and tracks the scroll. */}
        <nav aria-label="Photo chapters" className="-mx-5 mb-12 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:m-0 lg:overflow-visible lg:p-0 [&::-webkit-scrollbar]:hidden">
          <ol className="flex w-max gap-2 lg:sticky lg:top-32 lg:w-auto lg:flex-col lg:gap-0">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <a
                  href={`#photos-${c.id}`}
                  aria-current={active === i ? "true" : undefined}
                  className={cn(
                    "group flex items-center gap-3 whitespace-nowrap rounded-full border border-hairline px-4 py-2 text-sm transition-colors duration-500",
                    "lg:rounded-none lg:border-0 lg:px-0 lg:py-2.5",
                    active === i ? "bg-foreground/10 text-foreground lg:bg-transparent" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span aria-hidden className={cn("hidden h-px bg-current transition-all duration-700 ease-[var(--ease-out-expo)] lg:block", active === i ? "w-6" : "w-2.5 opacity-50")} />
                  <span className="font-mono text-[11px] tabular-nums opacity-60">{c.number}</span>
                  <span>{c.title}</span>
                  <span className="ml-auto hidden font-mono text-[11px] tabular-nums opacity-50 lg:inline">{c.count}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-24 md:space-y-36">
          {chapters.map((c) => (
            <section key={c.id} id={`photos-${c.id}`} data-chapter aria-labelledby={`photos-${c.id}-title`} className="scroll-mt-28">
              <header className="mb-6 flex flex-col gap-2 border-t border-hairline pt-5 md:mb-8 md:flex-row md:items-baseline md:justify-between md:gap-10">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{c.number}</span>
                  <h3 id={`photos-${c.id}-title`} className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {c.title}
                  </h3>
                </div>
                {c.note && <p className="max-w-sm text-sm text-muted-foreground md:text-right">{c.note}</p>}
              </header>
              {/* Curated rows: tiles share a height and fill the width (flex-grow = aspect ratio). */}
              <div className="space-y-3 md:space-y-4">{c.rows.map(row)}</div>
            </section>
          ))}
        </div>
      </div>

      {viewer && (
        <Suspense fallback={null}>
          <PhotoLightbox photos={reel} index={open} onIndex={setOpen} />
        </Suspense>
      )}
    </>
  )
}
