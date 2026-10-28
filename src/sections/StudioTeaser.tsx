import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { photos } from "@/content/photos"
import { profile } from "@/content/profile"
import { useAudio } from "@/audio/AudioProvider"
import { PlayRandom } from "@/components/PlayRandom"
import { BrandIcon } from "@/components/BrandIcon"
import { reel } from "@/components/studio/reel"

// WebGL carousel (ogl) and the viewer load as their own chunks, off the Home page's critical path.
const FlexCarousel = lazy(() => import("@/components/bits/FlexCarousel"))
const PhotoLightbox = lazy(() => import("@/components/PhotoLightbox"))

// Cards are a few hundred pixels tall, so the carousel's textures use the 900px previews.
const cards = reel.map((p) => ({ src: p.thumb, alt: "Photo by Aahil Afraz", title: p.label }))

export function StudioTeaser() {
  const { tracks } = useAudio()
  const [open, setOpen] = useState<number | null>(null)
  // Stays mounted after the first open so the viewer can animate out.
  const [viewer, setViewer] = useState(false)
  // The headline pills are a fixed pick, so adding photos never changes them.
  const pillA = photos.find((p) => p.name === "img-1989.jpg")?.thumb
  const pillB = photos.find((p) => p.name === "img-2224.jpg")?.thumb

  const pill = (src?: string, from = "from-ember", to = "to-[#5b55ff]") =>
    src ? (
      <span className="mx-2 inline-block h-[0.78em] w-[1.9em] -translate-y-[0.06em] rounded-full bg-cover bg-center align-middle grayscale-[20%]" style={{ backgroundImage: `url(${src})` }} />
    ) : (
      <span className={`mx-2 inline-block h-[0.78em] w-[1.9em] rounded-full bg-gradient-to-r ${from} ${to} align-middle`} />
    )

  return (
    <section className="theme-dark overflow-hidden py-32 md:py-48">
      <div className="container-x">
        <h2 className="display-lg mx-auto max-w-6xl text-center text-balance">
          I also take {pill(pillA)} photos and make music {pill(pillB, "from-[#b44cff]", "to-ember")} as{" "}
          <span className="text-ember-grad">{profile.artistName}</span>.
        </h2>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link to="/studio" className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background">
            See photos and music <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          {tracks.length > 0 ? (
            <PlayRandom />
          ) : (
            <>
              <a href={profile.links.spotify} target="_blank" rel="noreferrer" className="glass inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold">
                <BrandIcon name="spotify" className="text-[#1ed760]" /> Listen on Spotify
              </a>
              <a href={profile.links.appleMusic} target="_blank" rel="noreferrer" className="glass inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold">
                <BrandIcon name="applemusic" className="text-[#fa586a]" /> Listen on Apple Music
              </a>
            </>
          )}
        </div>
      </div>

      {cards.length > 0 && (
        <>
          {/* A continuous reel of every photo. Drag, swipe, trackpad or arrow keys move it; it steps on its
              own and pauses on hover. The vertical wheel is left to the page so scrolling never snags here.
              Clicking the centred photo opens it in the viewer, lit by its own colours. */}
          <div className="relative mt-20 h-[clamp(420px,68vh,680px)] w-full text-foreground md:mt-24">
            <Suspense fallback={null}>
              <FlexCarousel
                items={cards}
                preset="liquid"
                intro="rise"
                cardHeight={0.62}
                gap={16}
                radius={18}
                autoplay
                interval={3.2}
                captureWheel={false}
                focusOnClick={false}
                onSelect={(i) => {
                  setViewer(true)
                  setOpen(i)
                }}
              />
            </Suspense>
          </div>
          {viewer && (
            <Suspense fallback={null}>
              <PhotoLightbox photos={reel} index={open} onIndex={setOpen} />
            </Suspense>
          )}
        </>
      )}
    </section>
  )
}
