import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"
import { RevealText } from "@/motion/RevealText"
import { Turntable } from "@/components/studio/Turntable"
import { NowPlaying } from "@/components/studio/NowPlaying"
import { Tracklist } from "@/components/studio/Tracklist"
import { Follow } from "@/components/studio/Follow"
import { Ambient } from "@/components/studio/Ambient"
import { useAudio } from "@/audio/AudioProvider"
import { Gallery } from "@/components/studio/Gallery"
import { UpNext } from "@/components/studio/UpNext"
import MaskedHeading from "@/components/bits/MaskedHeading"
import { usePageMeta } from "@/hooks/usePageMeta"
import { profile } from "@/content/profile"
import { chapters, photos } from "@/content/photos"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

/**
 * The photo you're looking at while the photos section is in focus, else null: the one under
 * the cursor if there is one, otherwise the one nearest the middle of the viewport.
 * Settles for a beat before reporting, so fast scrolling doesn't strobe the ambient light.
 */
function usePhotoInFocus() {
  const [focus, setFocus] = useState<string | null>(null)
  useEffect(() => {
    let raf = 0
    let timer = 0
    let last: string | null = null
    let pointer: { x: number; y: number } | null = null
    const measure = () => {
      raf = 0
      const section = document.getElementById("photos")
      if (!section) return
      const mid = innerHeight / 2
      const r = section.getBoundingClientRect()
      let best: string | null = null
      const hovered = pointer && document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>("#photos [data-ambient]")
      if (hovered) best = hovered.dataset.ambient!
      else if (r.top < mid && r.bottom > mid) {
        let d = Infinity
        section.querySelectorAll<HTMLElement>("[data-ambient]").forEach((el) => {
          const b = el.getBoundingClientRect()
          if (b.bottom < 0 || b.top > innerHeight) return
          // Vertical distance decides; horizontal only breaks ties inside a row.
          const dist = Math.abs(b.top + b.height / 2 - mid) + Math.abs(b.left + b.width / 2 - innerWidth / 2) * 0.25
          if (dist < d) {
            d = dist
            best = el.dataset.ambient!
          }
        })
      }
      if (best === last) return
      last = best
      clearTimeout(timer)
      timer = window.setTimeout(() => setFocus(best), 220)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const onPointer = (e: PointerEvent) => {
      // Touch has no hover; phones stay on scroll focus.
      pointer = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null
      schedule()
    }
    const onLeave = () => {
      pointer = null
      schedule()
    }
    addEventListener("scroll", schedule, { passive: true })
    addEventListener("resize", schedule)
    addEventListener("pointermove", onPointer, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    measure()
    return () => {
      removeEventListener("scroll", schedule)
      removeEventListener("resize", schedule)
      removeEventListener("pointermove", onPointer)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [])
  return focus
}

/** The photo that shows through the letters of the "Photos" title. */
const TITLE_PHOTO = { name: "img-3086.jpg", position: "50% 26%", caption: "Through the letters: the Seine at sunset, Paris" }
const titlePhoto = photos.find((p) => p.name === TITLE_PHOTO.name)

/**
 * The darkroom, told in one pass: a turntable you can actually play, the tracklist, the next
 * release (whose cover began as one of the photos, so it hands you from music to photography),
 * where to follow, then the photos in chapters. Film grain throughout, and one ambient light
 * that follows whatever has your attention.
 */
export default function Studio() {
  usePageMeta("Studio — Aahil Afraz", "Photography by Aahil Afraz and music as Azrael, playable right on the page.")
  const hero = useRef<HTMLElement>(null)
  const { current, tracks } = useAudio()
  const photo = usePhotoInFocus()
  const [upNext, setUpNext] = useState<string | null>(null)
  const onUpNextLight = useCallback((key: string | null) => setUpNext(key), [])
  // Whatever has your attention lights the room: a photo in the gallery, the next release while
  // it's on screen, otherwise the track on the platter.
  const track = current ?? tracks[0]
  const light = photo ?? upNext ?? (track ? `track:${track.slug}` : null)
  const frameCount = chapters.reduce((n, c) => n + c.count, 0)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".hero-deck", { y: 80, opacity: 0, scale: 0.94, duration: 1.6, delay: 0.25 })
      gsap.from(".hero-copy > *", { y: 24, opacity: 0, stagger: 0.08, duration: 1.1, delay: 0.55 })
    },
    { scope: hero },
  )

  return (
    <main className="theme-dark relative isolate w-full max-w-full overflow-x-clip">
      {/* Backdrops stay on screen by sticking inside the page, not by being fixed, so they end where the page does. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-40">
        <div className="film-grain sticky top-0 h-svh" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Ambient source={light} strength={0.2} className="sticky top-0 h-svh w-full" />
      </div>

      {/* Hero: the deck */}
      <section ref={hero} className="relative flex min-h-svh items-center overflow-hidden">
        {/* Phones stack headline, deck, copy; desktop puts the deck in its own column. */}
        <div className="container-x grid gap-x-16 gap-y-12 pb-20 pt-32 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:grid-rows-[auto_1fr] lg:pt-28">
          <RevealText as="h1" split="chars" immediate delay={0.2} className="display-xl lg:self-end">
            <span className="text-titanium">Studio</span>
          </RevealText>
          <Turntable className="hero-deck lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" />
          <div>
            <div className="hero-copy">
              <p className="max-w-md lg:-mt-5 text-lg text-muted-foreground text-pretty md:text-xl">
                Photos I've taken and music I release as <span className="text-foreground">{profile.artistName}</span>. Everything plays right here, and keeps playing while you browse.
              </p>
              <div className="mt-10">
                <NowPlaying />
              </div>
              <nav aria-label="Studio sections" className="mt-12 flex gap-8 text-sm text-muted-foreground">
                <a href="#music" className="group -my-3 inline-flex items-center gap-1.5 py-3 transition-colors hover:text-foreground">
                  Music <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                </a>
                {photos.length > 0 && (
                  <a href="#photos" className="group -my-3 inline-flex items-center gap-1.5 py-3 transition-colors hover:text-foreground">
                    Photos <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                  </a>
                )}
                <a href="#up-next" className="group -my-3 inline-flex items-center gap-1.5 py-3 transition-colors hover:text-foreground">
                  Up next <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                </a>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Tracklist */}
      <section id="music" className="container-x scroll-mt-24 py-32 md:py-44">
        <div className="mb-14 flex flex-col justify-between gap-4 md:mb-20 md:flex-row md:items-end">
          <RevealText as="h2" split="lines" className="display-lg">
            Music
          </RevealText>
          <p className="max-w-sm text-muted-foreground">Released as {profile.artistName}. Pick a track, or click anywhere on a waveform to jump in.</p>
        </div>
        <Tracklist />
      </section>

      {/* Photos: appears automatically once photos exist in src/assets/photos. */}
      {photos.length > 0 && (
        <section id="photos" className="relative scroll-mt-24 border-t border-hairline py-32 md:py-48">
          <div className="container-x relative">
            <div className="mb-16 md:mb-24">
              {/* Title card for the photo half: one of the photos drifts inside the word itself. */}
              {titlePhoto ? (
                <MaskedHeading
                  tag="h2"
                  text="Photos"
                  src={titlePhoto.src}
                  position={TITLE_PHOTO.position}
                  align="left"
                  weight={800}
                  tracking={-0.055}
                  lineHeight={0.92}
                  textScale={0.285}
                  maxSize={440}
                  fillScale={1.35}
                  drift={26}
                  parallax={30}
                  brightness={1.12}
                  saturation={1.12}
                  duration={1.3}
                />
              ) : (
                <RevealText as="h2" split="lines" className="display-lg">
                  Photos
                </RevealText>
              )}
              <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                {titlePhoto && <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{TITLE_PHOTO.caption}</p>}
                <p className="max-w-sm text-muted-foreground">
                  {frameCount} frames in {chapters.length} chapters, in the order I'd show them. Tap any photo to view it full screen; arrow
                  keys or swipe to move through.
                </p>
              </div>
            </div>
            <Gallery />
          </div>
        </section>
      )}

      {/* The hinge: an unreleased single whose cover is one of the photos above. Closes the page. */}
      <UpNext onLight={onUpNextLight} />

      {/* Follow: closes the page, right after the release it points to. */}
      <section id="follow" className="container-x scroll-mt-24 pb-32 md:pb-48">
        <Follow />
      </section>
    </main>
  )
}
