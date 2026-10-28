import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RevealText } from "@/motion/RevealText"
import { upcoming } from "@/content/tracks"
import { chapters, photos } from "@/content/photos"
import { profile } from "@/content/profile"
import { cn } from "@/lib/utils"

type View = "cover" | "photo"

/**
 * The hinge between the music and the photos: the next release, whose cover started as one
 * of the photos further down. Flip between the two. While it's on screen it lights the room
 * with whichever one you're looking at (via `onLight`, a key in ambient.json, or null when it leaves).
 */
export function UpNext({ onLight }: { onLight: (key: string | null) => void }) {
  const root = useRef<HTMLElement>(null)
  const [view, setView] = useState<View>("cover")
  const [inView, setInView] = useState(false)
  const photo = photos.find((p) => p.name === upcoming.photo)
  const chapter = chapters.find((c) => c.id === upcoming.chapter)

  useEffect(() => {
    const el = root.current
    if (!el) return
    // "In view" means crossing the middle of the screen, the same rule the gallery uses.
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "-50% 0px -50% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    onLight(inView ? (view === "photo" ? upcoming.photo : `track:${upcoming.slug}`) : null)
  }, [inView, view, onLight])

  return (
    <section ref={root} id="up-next" aria-labelledby="up-next-title" className="container-x scroll-mt-24 pb-32 md:pb-44">
      <div className="grid items-center gap-12 border-t border-hairline pt-16 md:pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div className="lg:order-2">
          <div className="flex items-center gap-3">
            <p className="eyebrow">Up next</p>
            <Badge variant="outline" className="border-hairline font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Unreleased
            </Badge>
          </div>
          <RevealText as="h2" split="chars" className="display-lg mt-5">
            <span id="up-next-title">{upcoming.title}</span>
          </RevealText>
          <p className="mt-6 max-w-md text-lg text-pretty text-muted-foreground">
            The next {profile.artistName} single isn't out yet. Its cover started as one of my photos, a train station at night. Flip between
            them, or find the original{chapter ? ` in ${chapter.title}` : ""} above.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#follow"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:scale-[1.03]"
            >
              Hear it the day it drops
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            {chapter && (
              <a
                href={`#photos-${chapter.id}`}
                className="group inline-flex h-12 items-center gap-2 rounded-full border border-hairline px-6 text-[15px] font-semibold transition-colors hover:bg-foreground/5"
              >
                See the original photo
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )}
          </div>
        </div>

        <figure className="lg:order-1">
          {/* Both images stay mounted and crossfade, so flipping is instant and never reflows. */}
          <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#0b0d10] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
            <img
              src={upcoming.cover}
              width={1000}
              height={1000}
              alt={`Cover art for ${upcoming.title}`}
              loading="lazy"
              decoding="async"
              className={cn("absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)]", view === "cover" ? "opacity-100" : "scale-[1.03] opacity-0")}
            />
            {photo && (
              <img
                src={photo.src}
                width={photo.w}
                height={photo.h}
                alt="The original photo: a train station at night, lit teal"
                loading="lazy"
                decoding="async"
                className={cn("absolute inset-0 size-full object-cover object-[50%_40%] transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)]", view === "photo" ? "opacity-100" : "scale-[1.03] opacity-0")}
              />
            )}
          </div>
          {photo && (
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as View)}
                variant="outline"
                size="sm"
                spacing={0}
                aria-label="Show the cover or the original photo"
              >
                <ToggleGroupItem value="cover" className="border-hairline px-3.5 data-[state=on]:bg-foreground data-[state=on]:text-background">
                  Cover
                </ToggleGroupItem>
                <ToggleGroupItem value="photo" className="border-hairline px-3.5 data-[state=on]:bg-foreground data-[state=on]:text-background">
                  Original photo
                </ToggleGroupItem>
              </ToggleGroup>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{view === "cover" ? "Artwork" : "Shot by me"}</span>
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}
