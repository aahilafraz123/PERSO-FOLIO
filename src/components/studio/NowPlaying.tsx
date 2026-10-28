import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { useAudio, fmtTime } from "@/audio/AudioProvider"

/** Readout and transport beside the turntable. */
export function NowPlaying() {
  const { tracks, current, playing, time, toggle, next, prev } = useAudio()
  const shown = current ?? tracks[0]
  if (!shown) return null
  const pct = current ? (time / shown.duration) * 100 : 0
  const meta = [shown.credit, shown.bpm && `${shown.bpm} BPM`].filter(Boolean).join(" · ")

  return (
    <div className="max-w-md">
      <p className="eyebrow flex items-center gap-2">
        <span className={playing ? "size-1.5 animate-pulse rounded-full bg-[var(--track-accent)]" : "size-1.5 rounded-full bg-white/25"} />
        {playing ? "Now playing" : current ? "Paused" : "On the platter"}
      </p>
      <p key={shown.slug} className="mt-3 truncate text-2xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 md:text-3xl">
        {shown.title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Azrael{meta && <span className="text-dim"> · {meta}</span>}
      </p>

      <div className="mt-6 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[var(--track-accent)] transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-dim tabular-nums">
        <span>{fmtTime(current ? time : 0)}</span>
        <span>{fmtTime(shown.duration)}</span>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button onClick={prev} aria-label="Previous track" className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
          <SkipBack className="size-5 fill-current" />
        </button>
        <button
          onClick={() => toggle()}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-14 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-0.5 fill-current" />}
        </button>
        <button onClick={next} aria-label="Next track" className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
          <SkipForward className="size-5 fill-current" />
        </button>
        <p className="ml-3 text-xs leading-snug text-dim">
          Or drag the tonearm
          <br className="hidden sm:block" /> onto the record.
        </p>
      </div>
    </div>
  )
}
