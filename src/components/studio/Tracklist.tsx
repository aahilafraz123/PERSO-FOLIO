import { useRef, type CSSProperties } from "react"
import { Pause, Play } from "lucide-react"
import { useAudio, fmtTime } from "@/audio/AudioProvider"
import { BrandIcon } from "@/components/BrandIcon"
import { Waveform } from "@/components/studio/Waveform"
import { profile } from "@/content/profile"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/**
 * Editorial tracklist. Each row carries its own accent; the playing (or cued) row
 * opens to a waveform you can scrub.
 */
export function Tracklist() {
  const { tracks, index, playing, time, toggle, play, seek } = useAudio()
  const root = useRef<HTMLOListElement>(null)
  const open = index < 0 ? 0 : index

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".track-row", {
        y: 48,
        opacity: 0,
        stagger: 0.09,
        duration: 1.1,
        scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
      })
    },
    { scope: root },
  )

  return (
    <ol ref={root} className="border-b border-hairline">
      {tracks.map((t, i) => {
        const on = i === index
        const isOpen = i === open
        const live = on && playing
        const meta = [t.credit, t.bpm && `${t.bpm} BPM`].filter(Boolean).join(" · ")
        return (
          <li key={t.slug} className="track-row group border-t border-hairline" style={{ "--row-accent": t.accent } as CSSProperties}>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[2.5rem_auto_1fr_auto] md:gap-8 md:py-7">
              <span className="hidden font-mono text-xs text-dim tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>

              <button
                onClick={() => toggle(i)}
                aria-label={`${live ? "Pause" : "Play"} ${t.title}`}
                className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-graphite md:size-20"
              >
                <img src={t.coverSm} srcSet={`${t.coverSm} 160w, ${t.cover} 1000w`} sizes="80px" alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                <span className={cn("absolute inset-0 grid place-items-center bg-black/45 text-white transition-opacity duration-300", live ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                  {live ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
                </span>
              </button>

              <button onClick={() => toggle(i)} className="min-w-0 text-left" tabIndex={-1} aria-hidden>
                <span
                  className={cn(
                    "block text-balance sm:truncate text-[clamp(1.35rem,3.4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] transition-[color,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2 group-hover:text-[var(--row-accent)]",
                    on && "text-[var(--row-accent)]",
                  )}
                >
                  {t.title}
                </span>
                {meta && <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{meta}</span>}
              </button>

              <div className="flex items-center gap-3 md:gap-5">
                <span className="font-mono text-xs text-dim tabular-nums">{fmtTime(t.duration)}</span>
                <a href={t.spotify || profile.links.spotify} target="_blank" rel="noreferrer" aria-label={`${t.title} on Spotify`} className="hidden text-dim transition-colors hover:text-[#1ed760] sm:block">
                  <BrandIcon name="spotify" />
                </a>
                <a href={t.appleMusic || profile.links.appleMusic} target="_blank" rel="noreferrer" aria-label={`${t.title} on Apple Music`} className="hidden text-dim transition-colors hover:text-[#fa243c] sm:block">
                  <BrandIcon name="applemusic" />
                </a>
              </div>
            </div>

            <div className={cn("grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden" inert={!isOpen}>
                <div className="flex items-center gap-4 pb-7 pt-1 sm:pl-[calc(2.5rem+1rem)] md:gap-6 md:pl-[calc(2.5rem+2rem)]">
                  <span className="w-10 font-mono text-xs text-dim tabular-nums">{fmtTime(on ? time : 0)}</span>
                  <Waveform
                    peaks={t.peaks}
                    duration={t.duration}
                    progress={on ? time / t.duration : 0}
                    label={t.title}
                    onSeek={(s) => (on ? seek(s) : play(i, s))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right font-mono text-xs text-dim tabular-nums">{fmtTime(t.duration)}</span>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
