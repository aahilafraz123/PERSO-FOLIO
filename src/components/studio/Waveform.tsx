import { useId, useState, type KeyboardEvent, type MouseEvent } from "react"
import { fmtTime } from "@/audio/AudioProvider"
import { cn } from "@/lib/utils"

type Props = {
  peaks: number[]
  duration: number
  /** 0..1 */
  progress: number
  onSeek: (seconds: number) => void
  label: string
  className?: string
}

const BAR = 3
const GAP = 2

/** Precomputed peaks drawn as bars. Played portion fills with the track accent; hover previews the seek point. */
export function Waveform({ peaks, duration, progress, onSeek, label, className }: Props) {
  const clip = useId()
  const [hover, setHover] = useState<number | null>(null)
  const w = peaks.length * (BAR + GAP) - GAP
  const H = 48

  const at = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    onSeek(Math.min(Math.max(progress * duration + (e.key === "ArrowRight" ? 5 : -5), 0), duration))
  }

  const bars = peaks.map((p, i) => {
    const h = Math.max(p * H, 2)
    return <rect key={i} x={i * (BAR + GAP)} y={(H - h) / 2} width={BAR} height={h} rx={1.5} />
  })

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`Seek ${label}`}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(progress * duration)}
      aria-valuetext={`${fmtTime(progress * duration)} of ${fmtTime(duration)}`}
      onClick={(e) => onSeek(at(e) * duration)}
      onMouseMove={(e) => setHover(at(e))}
      onMouseLeave={() => setHover(null)}
      onKeyDown={onKey}
      className={cn("group/wave relative h-12 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40", className)}
    >
      <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="none" className="size-full">
        <defs>
          <clipPath id={clip}>
            <rect width={w} height={H} className="origin-left transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${progress})` }} />
          </clipPath>
        </defs>
        <g className="fill-white/15 transition-colors group-hover/wave:fill-white/25">{bars}</g>
        <g clipPath={`url(#${clip})`} style={{ fill: "var(--row-accent)" }}>
          {bars}
        </g>
      </svg>
      {hover !== null && (
        <span className="pointer-events-none absolute inset-y-0 w-px bg-white/70" style={{ left: `${hover * 100}%` }}>
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-black">
            {fmtTime(hover * duration)}
          </span>
        </span>
      )}
    </div>
  )
}
