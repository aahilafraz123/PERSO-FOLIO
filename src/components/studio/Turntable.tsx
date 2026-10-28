import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { MoveDownLeft, MoveHorizontal } from "lucide-react"
import { useAudio } from "@/audio/AudioProvider"
import { Visualizer } from "@/audio/Visualizer"
import { gsap, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/*
 * Geometry, in deck units (the SVG viewBox is 1000 x 700).
 * The platter sits left of center; the tonearm pivots top right. Angle 0 is the arm
 * hanging straight down on its rest; positive angles swing it clockwise over the record.
 */
const CX = 390
const CY = 350
const PLATTER_R = 310
const PX = 880
const PY = 120
const ARM = 520
const R_OUT = 284 // lead-in groove
const R_IN = 112 // run-out groove, just outside the label

const stylusRadius = (deg: number) => {
  const t = (deg * Math.PI) / 180
  return Math.hypot(PX - ARM * Math.sin(t) - CX, PY + ARM * Math.cos(t) - CY)
}
/** Radius falls monotonically from 0deg until the arm passes the spindle, so bisection is safe. */
const angleForRadius = (r: number) => {
  let lo = 0
  let hi = 75
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (stylusRadius(mid) > r) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
const A_OUT = angleForRadius(R_OUT)
const A_IN = angleForRadius(R_IN)
const angleFor = (p: number) => angleForRadius(R_OUT - Math.min(Math.max(p, 0), 1) * (R_OUT - R_IN))
const progressFor = (deg: number) => (R_OUT - stylusRadius(deg)) / (R_OUT - R_IN)

const HINT_KEY = "studio:tonearm-learned"

/** Where the headshell is for a given arm angle, as a position on the deck. */
const hintAt = (deg: number) => {
  const t = (deg * Math.PI) / 180
  const r = ARM - 40
  return { left: `${((PX - r * Math.sin(t)) / 1000) * 100}%`, top: `${((PY + r * Math.cos(t)) / 700) * 100}%` }
}

/** Platter box as percentages of the deck, so HTML layers line up with the SVG. */
const box = {
  left: `${((CX - PLATTER_R) / 1000) * 100}%`,
  top: `${((CY - PLATTER_R) / 700) * 100}%`,
  width: `${((PLATTER_R * 2) / 1000) * 100}%`,
}

export function Turntable({ className }: { className?: string }) {
  const { tracks, current, index, playing, time, duration, play, pause, toggle, seek } = useAudio()
  const shown = current ?? tracks[0]
  const svg = useRef<SVGSVGElement>(null)
  const record = useRef<HTMLDivElement>(null)
  const spin = useRef<gsap.core.Tween | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  // Lifting the arm back to its rest parks it there until the next play.
  const [parked, setParked] = useState(true)
  // Until someone has actually moved the arm, it pulses and a label says what it does.
  const [learned, setLearned] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === "1"
    } catch {
      return false
    }
  })
  const dragFrom = useRef(0)

  useEffect(() => {
    if (playing) setParked(false)
  }, [playing])

  const len = duration || shown?.duration || 1
  const progress = current ? time / len : 0
  const angle = drag ?? (current && !parked ? angleFor(progress) : 0)
  const onRecord = angle >= A_OUT - 1

  useGSAP(() => {
    if (!record.current || prefersReducedMotion()) return
    spin.current = gsap.to(record.current, { rotation: "+=360", duration: 1.8, ease: "none", repeat: -1, paused: true })
    spin.current.timeScale(0)
    return () => spin.current?.kill()
  })

  // 33 1/3 rpm with a motor's spin-up and a platter's coast-down.
  useEffect(() => {
    const t = spin.current
    if (!t) return
    if (playing) {
      t.play()
      gsap.to(t, { timeScale: 1, duration: 0.9, ease: "power2.out", overwrite: true })
    } else {
      gsap.to(t, { timeScale: 0, duration: 1.6, ease: "power2.out", overwrite: true, onComplete: () => t.pause() })
    }
  }, [playing])

  const pointerAngle = (e: PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    if (!m) return 0
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const deg = (Math.atan2(-(p.x - PX), p.y - PY) * 180) / Math.PI
    return Math.min(Math.max(deg, 0), A_IN)
  }

  const onDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragFrom.current = angle
    setDrag(pointerAngle(e))
  }
  const onMove = (e: PointerEvent<SVGGElement>) => {
    if (drag !== null) setDrag(pointerAngle(e))
  }
  const onUp = () => {
    if (drag === null) return
    const deg = drag
    setDrag(null)
    if (!learned && Math.abs(deg - dragFrom.current) > 3) {
      setLearned(true)
      try {
        localStorage.setItem(HINT_KEY, "1")
      } catch {
        /* private mode: the hint just shows again next visit */
      }
    }
    if (deg < A_OUT - 6) {
      setParked(true)
      pause()
      return
    }
    const i = index < 0 ? 0 : index
    // Dropping in the run-out would seek to the very end and skip straight to the next track.
    play(i, Math.min(Math.max(progressFor(deg), 0), 0.97) * (tracks[i]?.duration ?? len))
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      const at = Math.min(Math.max((current ? time : 0) + (e.key === "ArrowRight" ? 5 : -5), 0), len - 1)
      if (current) seek(at)
      else play(0, at)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-[860px]", className)}>
      <div className="deck relative aspect-[10/7] w-full select-none overflow-hidden rounded-[clamp(18px,3vw,32px)]">
        <span className="absolute left-[4%] top-[5.5%] font-mono text-[clamp(8px,1vw,11px)] uppercase tracking-[0.3em] text-white/25">Azrael · 33⅓</span>

        {/* Platter, record, and the visualizer ring bleeding out onto the deck */}
        <div className="absolute aspect-square" style={box}>
          <Visualizer className="absolute -inset-[18%] !h-[136%] !w-[136%]" radius={0.375} reach={0.1} bars={120} />
          <div className="platter absolute inset-0 rounded-full" />
          <button
            type="button"
            onClick={() => toggle()}
            aria-label={playing ? `Pause ${shown?.title}` : `Play ${shown?.title}`}
            className="absolute inset-[2.26%] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <div ref={record} className="vinyl absolute inset-0 rounded-full">
              <div className="absolute inset-[33.1%] overflow-hidden rounded-full ring-1 ring-black/60">
                {shown && <img key={shown.cover} src={shown.cover} alt="" className="size-full object-cover animate-in fade-in duration-700" />}
              </div>
            </div>
            <div aria-hidden className="vinyl-sheen pointer-events-none absolute inset-0 rounded-full" />
            <span aria-hidden className="absolute left-1/2 top-1/2 size-[2.4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white to-[#6d6d72] shadow-[0_1px_2px_rgb(0_0_0/0.8)]" />
          </button>
        </div>

        {/* Start / stop, like the real thing */}
        <button
          type="button"
          onClick={() => toggle()}
          aria-label={playing ? "Stop" : "Start"}
          className="absolute bottom-[5%] left-[4%] flex items-center gap-2 before:absolute before:-inset-3 before:content-[''] rounded-md border border-white/10 bg-gradient-to-b from-[#2a2a2e] to-[#17171a] px-[1.4%] py-[0.9%] font-mono text-[clamp(7px,0.9vw,10px)] uppercase tracking-[0.2em] text-white/55 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_2px_6px_rgb(0_0_0/0.6)] transition-colors hover:text-white active:translate-y-px"
        >
          <span className={cn("size-1.5 rounded-full transition-all duration-500", playing ? "bg-[var(--track-accent)] shadow-[0_0_10px_var(--track-accent)]" : "bg-white/15")} />
          Start · Stop
        </button>

        {/* Tonearm */}
        <svg ref={svg} viewBox="0 0 1000 700" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id="ti" x1="0" x2="1">
              <stop offset="0" stopColor="#6b6b70" />
              <stop offset="0.45" stopColor="#f2f2f5" />
              <stop offset="1" stopColor="#8a8a90" />
            </linearGradient>
            {/* A vertical line has a zero-width bounding box, so the tube's gradient must be in user space. */}
            <linearGradient id="ti-tube" gradientUnits="userSpaceOnUse" x1={PX - 5} x2={PX + 5} y1="0" y2="0">
              <stop offset="0" stopColor="#7a7a80" />
              <stop offset="0.4" stopColor="#f5f5f8" />
              <stop offset="1" stopColor="#6b6b70" />
            </linearGradient>
            <radialGradient id="base" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#3a3a3f" />
              <stop offset="1" stopColor="#101012" />
            </radialGradient>
          </defs>

          {/* Arm rest */}
          <rect x={PX - 16} y={PY + ARM - 150} width="32" height="26" rx="6" fill="#1c1c1f" stroke="rgb(255 255 255 / 0.08)" />
          {/* Pivot base */}
          <circle cx={PX} cy={PY} r="58" fill="url(#base)" stroke="rgb(255 255 255 / 0.07)" />
          <circle cx={PX} cy={PY} r="40" fill="none" stroke="rgb(255 255 255 / 0.06)" />

          <g
            role="slider"
            tabIndex={0}
            aria-label="Tonearm. Drag onto the record to play, off to stop. Arrow keys seek."
            aria-valuemin={0}
            aria-valuemax={Math.round(len)}
            aria-valuenow={Math.round(current ? time : 0)}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            className="pointer-events-auto cursor-grab touch-none outline-none active:cursor-grabbing [&:focus-visible_.arm-tube]:stroke-white"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${PX}px ${PY}px`,
              transformBox: "view-box",
              transition: drag === null ? "transform 0.9s var(--ease-out-expo), filter 0.5s" : "none",
              filter: `drop-shadow(${onRecord && playing ? "6px 10px 6px" : "14px 24px 14px"} rgb(0 0 0 / 0.65))`,
            }}
          >
            {/* Generous invisible hit area along the whole arm */}
            <line className="arm-hit" x1={PX} y1={PY} x2={PX} y2={PY + ARM} stroke="transparent" strokeLinecap="round" />
            <rect x={PX - 20} y={PY - 92} width="40" height="62" rx="9" fill="url(#ti)" />
            <line className="arm-tube" x1={PX} y1={PY} x2={PX} y2={PY + ARM - 72} stroke="url(#ti-tube)" strokeWidth="10" strokeLinecap="round" />
            <circle cx={PX} cy={PY} r="22" fill="url(#ti)" />
            <circle cx={PX} cy={PY} r="7" fill="#1a1a1c" />
            {/* "Grab me": a slow pulse around the headshell until the arm has been moved once */}
            {!learned && drag === null && (
              <circle cx={PX} cy={PY + ARM - 40} r="46" fill="none" stroke="var(--track-accent)" strokeWidth="3" className="tonearm-pulse pointer-events-none" />
            )}
            {/* Headshell with finger lift */}
            <path d={`M ${PX - 15} ${PY + ARM - 76} h 30 l 4 70 h -38 z`} fill="#1d1d20" stroke="url(#ti)" strokeWidth="2" />
            <path d={`M ${PX + 17} ${PY + ARM - 58} l 34 -16`} stroke="url(#ti)" strokeWidth="5" strokeLinecap="round" />
            <circle cx={PX} cy={PY + ARM - 4} r="4" className="transition-[fill] duration-500" fill={playing ? "var(--track-accent)" : "#8a8a90"} />
          </g>
        </svg>

        {/* The hint rides along with the headshell and says what the arm does from where it is. */}
        {!learned && drag === null && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 flex -translate-x-[calc(100%+14px)] -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[clamp(10px,1.1vw,12px)] font-medium text-white/85 shadow-lg backdrop-blur-md animate-in fade-in duration-700"
            style={{ ...hintAt(angle), transition: "left 0.9s var(--ease-out-expo), top 0.9s var(--ease-out-expo)" }}
          >
            {onRecord ? (
              <>
                <MoveHorizontal className="size-3.5 text-[var(--track-accent)]" /> Slide to scrub · lift off to stop
              </>
            ) : (
              <>
                <MoveDownLeft className="size-3.5 text-[var(--track-accent)]" /> Drag the arm onto the record
              </>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
