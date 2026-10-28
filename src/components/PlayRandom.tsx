import { Pause, Play } from "lucide-react"
import { useAudio } from "@/audio/AudioProvider"
import { cn } from "@/lib/utils"

/**
 * "Play one of Aahil's produced tracks": spins up a random track. While one plays, the pill
 * shows it on a turning record and pauses on click; the next click after that picks a new one.
 */
export function PlayRandom({ className }: { className?: string }) {
  const { tracks, current, playing, pause, playRandom } = useAudio()
  if (!tracks.length) return null
  const live = playing && current

  return (
    <button
      type="button"
      onClick={() => (live ? pause() : playRandom())}
      aria-label={live ? `Pause ${current.title}` : "Play one of Aahil's produced tracks, picked at random"}
      className={cn(
        "group inline-flex h-12 max-w-full items-center gap-3 rounded-full border border-white/15 bg-black/45 pl-1.5 pr-5 text-[14px] font-medium text-white backdrop-blur-md transition-colors duration-300 hover:bg-black/65",
        className,
      )}
    >
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[repeating-radial-gradient(circle,#0c0c0e_0,#0c0c0e_1.5px,#1a1a1c_2px)] ring-1 ring-white/15">
        {live ? (
          <>
            <img src={current.coverSm} alt="" className="absolute inset-[22%] size-[56%] animate-[spin_4s_linear_infinite] rounded-full object-cover" />
            <Pause className="relative size-3.5 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </>
        ) : (
          <Play className="size-3.5 translate-x-px fill-white text-white transition-transform duration-300 group-hover:scale-110" />
        )}
      </span>
      <span className="truncate">
        {live ? (
          <>
            <span className="text-white/55">Now playing </span>
            {current.title}
          </>
        ) : (
          "Play one of Aahil's produced tracks"
        )}
      </span>
    </button>
  )
}
