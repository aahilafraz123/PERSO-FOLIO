import { useEffect, type CSSProperties } from "react"
import { Link } from "react-router"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ArrowUpRight, Pause, Play, SkipBack, SkipForward, X } from "lucide-react"
import { useAudio, fmtTime } from "@/audio/AudioProvider"
import { Ambient } from "@/components/studio/Ambient"
import { Waveform } from "@/components/studio/Waveform"
import { BrandIcon } from "@/components/BrandIcon"
import { profile } from "@/content/profile"
import { useLenis } from "@/motion/SmoothScroll"
import { cn } from "@/lib/utils"

/**
 * Track details, opened from the mini player: big cover, credits, a waveform you can scrub,
 * transport, where else to listen, and the rest of the catalogue. Same room as the photo
 * viewer: blacked out, lit only by a faint wash of the cover's colours.
 * Lazy-loaded by the player, so none of this downloads until someone opens it.
 */
export default function TrackModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tracks, current, index, playing, time, duration, toggle, next, prev, seek, play } = useAudio()
  const lenis = useLenis()
  const track = current ?? tracks[0]

  useEffect(() => {
    if (!lenis) return
    if (open) lenis.stop()
    else lenis.start()
  }, [open, lenis])

  if (!track) return null
  const on = !!current
  const len = (on && duration) || track.duration
  const meta = [track.credit, track.bpm && `${track.bpm} BPM`].filter(Boolean).join(" · ")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
          <Ambient source={`track:${track.slug}`} strength={0.18} className="absolute inset-0" />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="theme-dark fixed inset-0 z-[71] overflow-y-auto p-4 text-white outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 md:grid md:place-items-center md:p-8"
          onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
          data-lenis-prevent
        >
          <div className="relative mx-auto w-full max-w-[860px] py-10 md:py-0" style={{ "--row-accent": track.accent } as CSSProperties}>
            <DialogPrimitive.Close className="absolute right-0 top-0 grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Close">
              <X className="size-5" />
            </DialogPrimitive.Close>

            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-12">
              <img
                key={track.slug}
                src={track.cover}
                alt={`${track.title} cover art`}
                className="mx-auto aspect-square w-full max-w-[320px] rounded-2xl object-cover shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9)] animate-in fade-in zoom-in-95 duration-500"
              />

              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-2">
                  <span className={playing ? "size-1.5 animate-pulse rounded-full bg-[var(--row-accent)]" : "size-1.5 rounded-full bg-white/25"} />
                  {playing ? "Now playing" : on ? "Paused" : "Up first"}
                </p>
                <DialogPrimitive.Title className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{track.title}</DialogPrimitive.Title>
                <p className="mt-1.5 text-sm text-white/60">
                  Produced by {profile.artistName}
                  {meta && <span className="text-white/40"> · {meta}</span>}
                </p>

                <div className="mt-7 flex items-center gap-3">
                  <span className="w-9 font-mono text-[11px] tabular-nums text-white/50">{fmtTime(on ? time : 0)}</span>
                  <Waveform
                    peaks={track.peaks}
                    duration={len}
                    progress={on ? time / len : 0}
                    label={track.title}
                    onSeek={(s) => (on ? seek(s) : play(Math.max(index, 0), s))}
                    className="h-10 flex-1"
                  />
                  <span className="w-9 text-right font-mono text-[11px] tabular-nums text-white/50">{fmtTime(len)}</span>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button onClick={prev} aria-label="Previous track" className="grid size-11 place-items-center rounded-full text-white/60 transition-colors hover:text-white">
                    <SkipBack className="size-5 fill-current" />
                  </button>
                  <button onClick={() => toggle()} aria-label={playing ? "Pause" : "Play"} className="grid size-14 place-items-center rounded-full bg-white text-black transition-transform duration-300 hover:scale-105 active:scale-95">
                    {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-0.5 fill-current" />}
                  </button>
                  <button onClick={next} aria-label="Next track" className="grid size-11 place-items-center rounded-full text-white/60 transition-colors hover:text-white">
                    <SkipForward className="size-5 fill-current" />
                  </button>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  <a href={track.spotify || profile.links.spotify} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium transition-colors hover:border-[#1ed760]/60 hover:bg-[#1ed760]/10">
                    <BrandIcon name="spotify" className="text-[#1ed760]" /> Spotify <ArrowUpRight className="size-3.5 text-white/50" />
                  </a>
                  <a href={track.appleMusic || profile.links.appleMusic} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium transition-colors hover:border-[#fa243c]/60 hover:bg-[#fa243c]/10">
                    <BrandIcon name="applemusic" className="text-[#fa243c]" /> Apple Music <ArrowUpRight className="size-3.5 text-white/50" />
                  </a>
                  <Link to="/studio#music" onClick={() => onOpenChange(false)} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium transition-colors hover:bg-white/10">
                    All tracks in the Studio
                  </Link>
                </div>
              </div>
            </div>

            {tracks.length > 1 && (
              <div className="mt-10 border-t border-white/10 pt-5">
                <p className="eyebrow mb-3">More from {profile.artistName}</p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {tracks.map((t, i) => {
                    const here = t.slug === track.slug
                    return (
                      <li key={t.slug}>
                        <button
                          onClick={() => (here ? toggle() : play(i, 0))}
                          className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.06]", here && "bg-white/[0.06]")}
                          style={{ "--row-accent": t.accent } as CSSProperties}
                        >
                          <img src={t.coverSm} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                          <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", here && "text-[var(--row-accent)]")}>{t.title}</span>
                          <span className="font-mono text-[11px] tabular-nums text-white/40">{fmtTime(t.duration)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
