import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { MapPin, X } from "lucide-react"
import MorphSlider, { type MorphSliderHandle } from "@/components/bits/MorphSlider"
import { Ambient } from "@/components/studio/Ambient"
import { useLenis } from "@/motion/SmoothScroll"
import { useMedia } from "@/hooks/useMedia"

/**
 * A photo to show. Captions come from `place`/`region`/`coords` (About) or a plain `label`
 * (Studio chapters). `ambient` is the photo's key in ambient.json, for the faint colour behind it.
 */
export type LightboxPhoto = {
  name: string
  ambient: string
  src: string
  w: number
  h: number
  place?: string
  region?: string
  coords?: string
  label?: string
}

const describe = (p: LightboxPhoto) => (p.place ? `taken in ${[p.place, p.region].filter(Boolean).join(", ")}` : p.label ?? "")

/** One move from photo to photo: the morph and the card reshaping share this timing. */
const MORPH_S = 1.8
const MORPH_CSS = `${MORPH_S}s cubic-bezier(0.45, 0, 0.55, 1)`

/**
 * Photo viewer: one contained slider card on a blacked-out page, lit only by a faint wash of
 * the current photo's own colours. Moving between photos slowly morphs one into the next
 * (React Bits MorphSlider) while the card reshapes to the new photo, so every photo is shown
 * uncropped at its own aspect ratio. Arrows and dots
 * sit on the photo, "Close" sits right above it, and a one-line hint says what else works:
 * drag or swipe, arrow keys, Esc, or clicking outside the card.
 * Lazy-loaded by its callers, so the WebGL code only downloads when someone opens a photo.
 */
export default function PhotoLightbox({ photos, index, onIndex }: { photos: LightboxPhoto[]; index: number | null; onIndex: (i: number | null) => void }) {
  const lenis = useLenis()
  const open = index !== null

  useEffect(() => {
    if (!lenis) return
    if (open) lenis.stop()
    else lenis.start()
  }, [open, lenis])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onIndex(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[71] grid place-items-center p-4 text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0 md:p-8"
          // Clicking anywhere outside the card closes it.
          onClick={(e) => e.target === e.currentTarget && onIndex(null)}
        >
          {/* Mounted per open, so the slider always starts on the photo that was clicked. */}
          {index !== null && <Viewer photos={photos} start={index} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Viewer({ photos, start }: { photos: LightboxPhoto[]; start: number }) {
  const slider = useRef<MorphSliderHandle>(null)
  const [first] = useState(start)
  const [current, setCurrent] = useState(start)
  const photo = photos[current]
  // On phones the caption would cover half the photo, so it moves under the card.
  const wide = useMedia("(min-width: 768px)")

  const items = useMemo(
    () =>
      photos.map((p) => ({
        image: p.src,
        caption: p.place ? (
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-ember" aria-hidden />
            {[p.place, p.region].filter(Boolean).join(", ")}
            {p.coords && <span className="font-mono text-[11px] font-normal tracking-wide text-white/60">{p.coords}</span>}
          </span>
        ) : (
          p.label
        ),
      })),
    [photos],
  )

  // Arrow keys work wherever focus is inside the viewer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") slider.current?.next()
      if (e.key === "ArrowLeft") slider.current?.prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // The card is always the current photo's exact shape (the slider crops to its box, so a fixed
  // box would crop every other photo), as large as fits: up to 1100px wide, ~72% of the height.
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  const aspect = photo.w / photo.h
  let boxW = Math.min(1100, vp.w - (wide ? 64 : 32))
  let boxH = boxW / aspect
  if (boxH > vp.h * 0.72) {
    boxH = vp.h * 0.72
    boxW = boxH * aspect
  }
  const reshape = { transition: `width ${MORPH_CSS}, height ${MORPH_CSS}` }

  return (
    <>
      {/* The only light in the room: a faint, blurred wash of the photo on screen. */}
      <Ambient source={photo.ambient} strength={0.14} className="absolute inset-0" />
      <div className="relative" style={{ width: boxW, ...reshape }}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <DialogPrimitive.Title className="text-sm font-medium text-white/80">
          Photo {current + 1} of {photos.length}
          {describe(photo) && <span className="sr-only">, {describe(photo)}</span>}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1d1d1f] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]">
          <X className="size-4" /> Close
        </DialogPrimitive.Close>
      </div>

      <div className="shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)]" style={{ width: boxW, height: boxH, ...reshape }}>
        <MorphSlider
          ref={slider}
          items={items}
          startIndex={first}
          onIndexChange={setCurrent}
          transition="melt"
          duration={MORPH_S}
          ease="sine.inOut"
          intensity={0.3}
          aberration={0.12}
          drift={0.2}
          radius={20}
          // A long Studio reel would overflow a row of dots; the counter above does that job.
          showIndicators={photos.length <= 12}
          showCaptions={wide}
          ariaLabel="Photos I took. Drag or use the arrows to browse."
        />
      </div>

      {!wide && (
        <p key={current} className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold animate-in fade-in duration-500">
          {items[current].caption}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-white/50">
        <span className="hidden md:inline">Use the arrows, drag, or press ← → to browse · Esc or click outside to close</span>
        <span className="md:hidden">Swipe or tap the arrows to browse</span>
      </p>
      </div>
    </>
  )
}
