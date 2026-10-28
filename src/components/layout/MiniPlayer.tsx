import { lazy, Suspense, useState } from "react"
import { Pause, Play, SkipForward } from "lucide-react"
import { useAudio } from "@/audio/AudioProvider"
import { usePlayerDocked } from "./playerDock"
import { cn } from "@/lib/utils"

/**
 * Persistent now-playing dock. Appears once a track has been started, survives route changes,
 * and steps aside while the footer is on screen (the footer shows the same card in its slot).
 */
export function MiniPlayer() {
  const { current } = useAudio()
  const docked = usePlayerDocked()
  const shown = !!current && !docked

  return (
    <div
      aria-live="polite"
      aria-hidden={!shown}
      className={cn(
        "fixed bottom-5 left-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 transition-all duration-700 ease-[var(--ease-out-expo)]",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
      )}
    >
      <PlayerCard className="shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]" />
    </div>
  )
}

// Track details: their own chunk, fetched when a pointer reaches the card.
const loadTrackModal = () => import("./TrackModal")
const TrackModal = lazy(loadTrackModal)

/**
 * The player itself. Before anything has played it offers the first track.
 * Clicking the cover or title opens the track's details.
 */
export function PlayerCard({ className }: { className?: string }) {
  const { current, playing, toggle, next, time, duration, tracks } = useAudio()
  const [details, setDetails] = useState(false)
  // Stays mounted after the first open so the modal can animate out.
  const [mounted, setMounted] = useState(false)
  const track = current ?? tracks[0]
  const pct = current && duration ? (time / duration) * 100 : 0
  if (!track) return null

  return (
    <div className={cn("glass relative flex items-center gap-3 overflow-hidden rounded-2xl p-2 pr-3", className)}>
      <button
        type="button"
        onPointerEnter={loadTrackModal}
        onFocus={loadTrackModal}
        onClick={() => {
          setMounted(true)
          setDetails(true)
        }}
        aria-label={`Open details for ${track.title}`}
        className="group/open -m-1 flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-white/[0.06]"
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-graphite">
          <img src={track.coverSm} alt="" className={cn("size-full object-cover", playing && "animate-[spin_12s_linear_infinite] rounded-full")} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{track.title}</span>
          <span className="block text-xs text-muted-foreground">
            {current ? "Azrael" : "Listen to Azrael"}
            <span className="opacity-0 transition-opacity group-hover/open:opacity-100 [@media(hover:none)]:opacity-100"> · Details</span>
          </span>
        </span>
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <TrackModal open={details} onOpenChange={setDetails} />
        </Suspense>
      )}
      <button onClick={() => toggle()} className="grid size-9 place-items-center rounded-full bg-foreground text-background" aria-label={playing ? "Pause" : `Play ${track.title}`}>
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
      </button>
      {tracks.length > 1 && (
        <button onClick={next} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground" aria-label="Next track">
          <SkipForward className="size-4 fill-current" />
        </button>
      )}
      <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
        <span className="block h-full bg-[var(--track-accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}
