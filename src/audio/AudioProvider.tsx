import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { tracks, type Track } from "@/content/tracks"

type AudioState = {
  tracks: Track[]
  current: Track | null
  index: number
  playing: boolean
  time: number
  duration: number
  analyser: AnalyserNode | null
  /** Plays track i (default: current), optionally starting `at` seconds in. */
  play: (i?: number, at?: number) => void
  toggle: (i?: number) => void
  pause: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  /** Plays a random track, never the one already loaded. */
  playRandom: () => void
}

const Ctx = createContext<AudioState | null>(null)

export function useAudio() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAudio outside AudioProvider")
  return v
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = new Audio()
    a.preload = "metadata"
    audioRef.current = a
    const onTime = () => setTime(a.currentTime)
    const onMeta = () => setDuration(a.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("play", onPlay)
    a.addEventListener("pause", onPause)
    return () => {
      a.pause()
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("loadedmetadata", onMeta)
      a.removeEventListener("play", onPlay)
      a.removeEventListener("pause", onPause)
      ctxRef.current?.close()
    }
  }, [])

  /** The analyser needs a user gesture, so it is wired on first play. */
  const ensureGraph = useCallback(() => {
    const a = audioRef.current
    if (!a || ctxRef.current) {
      ctxRef.current?.resume()
      return
    }
    const ctx = new AudioContext()
    const src = ctx.createMediaElementSource(a)
    const an = ctx.createAnalyser()
    an.fftSize = 256
    an.smoothingTimeConstant = 0.82
    src.connect(an)
    an.connect(ctx.destination)
    ctxRef.current = ctx
    setAnalyser(an)
  }, [])

  const load = useCallback((i: number) => {
    const a = audioRef.current
    const t = tracks[i]
    if (!a || !t) return
    a.src = t.file
    setIndex(i)
    setTime(0)
  }, [])

  const play = useCallback(
    (i?: number, at?: number) => {
      const a = audioRef.current
      if (!a || !tracks.length) return
      const target = i ?? (index < 0 ? 0 : index)
      if (target !== index) {
        load(target)
        // currentTime can't be set until the new source has metadata.
        if (at !== undefined) a.addEventListener("loadedmetadata", () => (a.currentTime = at), { once: true })
      } else if (at !== undefined) {
        a.currentTime = at
      }
      ensureGraph()
      void a.play()
    },
    [index, load, ensureGraph],
  )

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(
    (i?: number) => {
      if (playing && (i === undefined || i === index)) pause()
      else play(i)
    },
    [playing, index, play, pause],
  )

  const next = useCallback(() => {
    if (!tracks.length) return
    play((index + 1) % tracks.length)
  }, [index, play])

  const prev = useCallback(() => {
    const a = audioRef.current
    if (!tracks.length || !a) return
    if (a.currentTime > 3) a.currentTime = 0
    else play((index - 1 + tracks.length) % tracks.length)
  }, [index, play])

  const playRandom = useCallback(() => {
    if (!tracks.length) return
    const pool = tracks.map((_, i) => i).filter((i) => i !== index || tracks.length === 1)
    play(pool[Math.floor(Math.random() * pool.length)], 0)
  }, [index, play])

  const seek = useCallback((s: number) => {
    if (audioRef.current) audioRef.current.currentTime = s
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.addEventListener("ended", next)
    return () => a.removeEventListener("ended", next)
  }, [next])

  // The page accent follows the playing track (see @property --track-accent in index.css).
  useEffect(() => {
    const t = tracks[index]
    const root = document.documentElement.style
    if (t) root.setProperty("--track-accent", t.accent)
    else root.removeProperty("--track-accent")
  }, [index])

  // Lock-screen / media keys.
  useEffect(() => {
    const t = tracks[index]
    if (!t || !("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: "Azrael",
      artwork: [{ src: t.cover, sizes: "1000x1000", type: "image/jpeg" }],
    })
    navigator.mediaSession.setActionHandler("play", () => play())
    navigator.mediaSession.setActionHandler("pause", pause)
    navigator.mediaSession.setActionHandler("nexttrack", next)
    navigator.mediaSession.setActionHandler("previoustrack", prev)
  }, [index, play, pause, next, prev])

  const value = useMemo<AudioState>(
    () => ({
      tracks,
      current: tracks[index] ?? null,
      index,
      playing,
      time,
      duration,
      analyser,
      play,
      toggle,
      pause,
      next,
      prev,
      seek,
      playRandom,
    }),
    [index, playing, time, duration, analyser, play, toggle, pause, next, prev, seek, playRandom],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const fmtTime = (s: number) => {
  if (!Number.isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}
