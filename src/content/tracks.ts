import waveforms from "./waveforms.json"

/**
 * Your music. Audio lives in `public/music/<slug>.m4a` (AAC 256k), cover art in
 * `public/music/covers/<slug>.jpg` plus a `<slug>.sm.jpg` thumbnail.
 * Durations and waveform peaks are precomputed into `waveforms.json`, keyed by slug.
 * `accent` tints the Studio page and mini player while the track plays.
 * Leave `spotify` / `appleMusic` empty to fall back to the artist pages.
 */
export type Track = {
  slug: keyof typeof waveforms
  title: string
  file: string
  cover: string
  coverSm: string
  accent: string
  duration: number
  peaks: number[]
  bpm?: number
  credit?: string
  spotify?: string
  appleMusic?: string
}

type Entry = Pick<Track, "slug" | "title" | "accent" | "bpm" | "credit" | "spotify" | "appleMusic">

const entries: Entry[] = [
  { slug: "raining-agony", title: "it's raining agony", accent: "#ff3d7f", credit: "with iamluko" },
  { slug: "i-need-every-piece-of-you", title: "I need every piece of you", accent: "#e5283c", bpm: 87 },
  { slug: "lazarus", title: "Lazarus", accent: "#d9a441", bpm: 124 },
  { slug: "3am-at-penthouse-2099", title: "3AM at Penthouse 2099", accent: "#6fd6e8", bpm: 125 },
]

export const tracks: Track[] = entries.map((e) => ({
  ...e,
  file: `/music/${e.slug}.m4a`,
  cover: `/music/covers/${e.slug}.jpg`,
  coverSm: `/music/covers/${e.slug}.sm.jpg`,
  ...waveforms[e.slug],
}))

/**
 * Next release: not out yet, so there's no audio or waveform, just the cover.
 * `photo` is the photograph the cover was made from (a name in src/assets/photos).
 */
export const upcoming = {
  slug: "requiem",
  title: "requiem",
  cover: "/music/covers/requiem.jpg",
  photo: "img-3118.jpg",
  chapter: "transit",
}
