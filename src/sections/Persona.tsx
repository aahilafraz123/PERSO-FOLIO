import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { ArrowLeft, ArrowUp, ArrowUpRight, MapPin } from "lucide-react"
import { ScrubText } from "@/motion/ScrubText"
import { RevealText } from "@/motion/RevealText"
import { Parallax } from "@/motion/Parallax"
import { profile, about } from "@/content/profile"
import { photos } from "@/content/photos"

// The viewer (and the ambient colour data it carries) only downloads once someone reaches for a photo.
const loadLightbox = () => import("@/components/PhotoLightbox")
const PhotoLightbox = lazy(loadLightbox)

/** About: photos I took, a few plain paragraphs, and the facts. */
export function Persona() {
  const [open, setOpen] = useState<number | null>(null)
  // Stays mounted after the first open so the viewer can animate out.
  const [viewer, setViewer] = useState(false)
  const shots = about.photos
    .map((meta) => {
      const frame = photos.find((p) => p.name === `${meta.name}.jpg`)
      return frame && { ...frame, ...meta, ambient: frame.name }
    })
    .filter((p) => p !== undefined)
  const places = shots.map((s) => s.place)
  const placeList = places.length > 1 ? `${places.slice(0, -1).join(", ")} and ${places.at(-1)}` : places[0]

  return (
    <section className="theme-dark relative py-32 md:py-48">
      <div className="container-x">
        <ScrubText className="display-md mx-auto max-w-5xl text-center" text={about.statement} />

        <div className="mt-32 grid items-center gap-12 md:mt-48 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          {/* I'm usually behind the camera, so these are photos I took rather than of me. */}
          {shots.length === 3 && (
            <figure>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {shots.map((p, i) => (
                  <button
                    key={p.name}
                    type="button"
                    onPointerEnter={loadLightbox}
                    onFocus={loadLightbox}
                    onClick={() => {
                      setViewer(true)
                      setOpen(i)
                    }}
                    aria-label={`View photo I took in ${p.place}, ${p.region}`}
                    className={`group relative cursor-zoom-in overflow-hidden rounded-[16px] bg-[#111113] ${i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"}`}
                  >
                    <Parallax depth={0.1} className="size-full">
                      <img
                        src={p.src}
                        width={p.w}
                        height={p.h}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full scale-110 object-cover transition-[filter] duration-700 group-hover:brightness-110"
                      />
                    </Parallax>
                    {/* Location marker: city always, coordinates slide out on hover. */}
                    <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 py-1 pl-2 pr-2.5 text-[12px] font-medium text-white shadow-[0_4px_16px_rgb(0_0_0/0.3)] backdrop-blur-md md:bottom-4 md:left-4">
                      <MapPin className="size-3.5 shrink-0 text-ember" aria-hidden />
                      <span className="whitespace-nowrap">
                        {p.place}
                        <span className="hidden sm:inline">, {p.region}</span>
                      </span>
                      <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-out-expo group-hover:grid-cols-[1fr]">
                        <span className="overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-wide text-white/60">
                          <span className="pl-1.5">{p.coords}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <figcaption className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Photos I took in {placeList}</span>
                <Link to="/studio#photos" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                  More in the Studio <ArrowUpRight className="size-3.5" />
                </Link>
              </figcaption>
            </figure>
          )}
          {viewer && (
            <Suspense fallback={null}>
              <PhotoLightbox photos={shots} index={open} onIndex={setOpen} />
            </Suspense>
          )}

          <div>
            <RevealText as="h2" split="lines" className="display-lg">
              About me
            </RevealText>
            <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-foreground/80">
              {about.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p>
                {about.outside}
                {shots.length > 0 && (
                  <>
                    {" "}
                    <span className="text-foreground">
                      <span className="hidden lg:inline">
                        The photos on the left
                        <ArrowLeft className="mx-1 inline size-4 -translate-y-px text-ember" aria-hidden />
                      </span>
                      <span className="lg:hidden">
                        The photos above
                        <ArrowUp className="mx-1 inline size-4 -translate-y-px text-ember" aria-hidden />
                      </span>
                      are mine
                    </span>
                    , shot in {placeList}.
                  </>
                )}
              </p>
            </div>

            <dl className="mt-12 divide-y divide-hairline border-y border-hairline">
              {about.facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[8.5rem_1fr] gap-4 py-4 text-[15px]">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="text-foreground/90">
                    {f.href ? (
                      <a href={f.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground">
                        {f.value} <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : (
                      f.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href={profile.links.resume} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
                Resume <ArrowUpRight className="size-4" />
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
                LinkedIn <ArrowUpRight className="size-4" />
              </a>
              <Link to="/studio" className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-foreground/5">
                Photos and music
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
