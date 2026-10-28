/**
 * Photography.
 *
 * Singles: `src/assets/photos/<name>.jpg` (+ `<name>.thumb.jpg` preview).
 * Series (carousel sets that must read left to right, edge to edge):
 *   `src/assets/photos/series-<key>/1.jpg, 2.jpg, ...` (+ `.thumb.jpg` previews).
 * `manifest.json` holds pixel sizes so the layout never shifts while images load.
 * Originals live in /photos (git-ignored). After adding more: `python3 scripts/photos.py`, then `python3 scripts/ambient.py`.
 */
import manifest from "@/assets/photos/manifest.json"

export type Frame = { src: string; thumb: string; w: number; h: number; name: string; caption?: string }
export type Entry = { kind: "single"; frame: Frame } | { kind: "series"; key: string; title?: string; frames: Frame[] }

/** Optional captions, keyed by path inside src/assets/photos (e.g. "img-3202.jpg"). */
export const captions: Record<string, string> = {}

/** Optional titles for series, keyed by folder suffix (series-dpt -> "dpt"). */
export const seriesTitles: Record<string, string> = {}

const full = import.meta.glob(["/src/assets/photos/**/*.jpg", "!/src/assets/photos/**/*.thumb.jpg"], {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>

const thumbs = import.meta.glob("/src/assets/photos/**/*.thumb.jpg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>

const sizes = manifest as unknown as Record<string, [number, number]>
const ROOT = "/src/assets/photos/"

const frames: Frame[] = Object.entries(full).map(([path, src]) => {
  const name = path.slice(ROOT.length)
  const [w, h] = sizes[name] ?? [3, 2]
  return { src, thumb: thumbs[path.replace(/\.jpg$/, ".thumb.jpg")] ?? src, w, h, name, caption: captions[name] }
})

const byNumber = (a: Frame, b: Frame) => parseInt(a.name.split("/").pop()!) - parseInt(b.name.split("/").pop()!)

const singles = frames.filter((f) => !f.name.includes("/")).sort((a, b) => a.name.localeCompare(b.name))

const series: Entry[] = Object.entries(
  frames
    .filter((f) => f.name.startsWith("series-"))
    .reduce<Record<string, Frame[]>>((acc, f) => {
      const key = f.name.split("/")[0].replace("series-", "")
      ;(acc[key] ??= []).push(f)
      return acc
    }, {}),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, fs]) => ({ kind: "series" as const, key, title: seriesTitles[key], frames: fs.sort(byNumber) }))

/*
 * Curated sequence, in chapters. Each line is one row; photos in a row share a height and fill the width.
 * A number after a name crops that photo to a display aspect (width / height); an optional
 * third value sets which part of the photo the crop keeps (CSS object-position).
 * Chapters run in colour order (teal and red, gold, green, teal night, night blue) so the
 * Studio's ambient light drifts from one chapter to the next instead of jumping.
 * Anything not listed is appended automatically in a last chapter, so new photos always show.
 */
type Pick = string | [string, number] | [string, number, string]
type Line = Pick[] | `series:${string}`
const curated: { id: string; title: string; note: string; lines: Line[] }[] = [
  {
    id: "portraits",
    title: "Portraits",
    note: "Two series and a few frames on their own, mostly in low light.",
    lines: ["series:dpt", ["img-2823", "img-2837", "img-2838"], "series:ept", [["img-2224", 2, "50% 30%"]]],
  },
  {
    id: "paris",
    title: "Paris",
    note: "An opera house lit in gold, then the Seine at sunset.",
    // The grand hall leads, wide and alone; the two ceiling details follow as a pair; the
    // sunset closes the chapter as a quiet, slimmer note rather than competing for the lead.
    lines: [[["img-3059", 1.7, "50% 50%"]], ["img-3042", "img-3046"], [["img-3086", 3.2]]],
  },
  {
    id: "netherlands",
    title: "Netherlands",
    note: "Windmills, canals, sheep and ducks.",
    lines: [["img-3196", "img-3197", "img-3198"], [["img-3215", 21 / 9]], ["img-3201", "img-3202", "img-3217"], ["img-3254", "img-3258"]],
  },
  {
    id: "transit",
    title: "In transit",
    note: "Stations, a subway car, a plane window, and cars after dark.",
    lines: [["img-3118", "img-3123", "img-0803", "img-8553"], [["img-1989", 2.4]], ["img-2436", "img-2290"], ["img-2280", "img-9310"]],
  },
  {
    id: "still",
    title: "Standing still",
    note: "A skyline, a statue, a wall of records, roses at dusk.",
    lines: [[["img-2633", 21 / 9]], ["img-2466", "work", "img-0217"], ["img-1578", "img-2195", "img-5113"]],
  },
]

export type Tile = { frame: Frame; aspect: number; focus?: string; index: number }
export type Row = { kind: "row"; tiles: Tile[] } | { kind: "series"; entry: Extract<Entry, { kind: "series" }>; index: number }
export type Chapter = { id: string; number: string; title: string; note?: string; rows: Row[]; count: number }

function build(): { chapters: Chapter[]; entries: Entry[]; entryChapter: string[] } {
  const bySingle = new Map(singles.map((f) => [f.name.replace(/\.jpg$/, ""), f]))
  const bySeries = new Map(series.map((e) => [(e as Extract<Entry, { kind: "series" }>).key, e as Extract<Entry, { kind: "series" }>]))
  const used = new Set<string>()
  const chapters: Chapter[] = []
  const entries: Entry[] = []
  const entryChapter: string[] = []

  const open = (id: string, title: string, note?: string) => {
    chapters.push({ id, number: String(chapters.length + 1).padStart(2, "0"), title, note, rows: [], count: 0 })
    return chapters.at(-1)!
  }
  const push = (c: Chapter, e: Entry) => {
    entries.push(e)
    entryChapter.push(c.title)
    c.count += e.kind === "series" ? e.frames.length : 1
  }
  const addSeries = (c: Chapter, key: string) => {
    const entry = bySeries.get(key)
    if (!entry || used.has("series:" + key)) return
    used.add("series:" + key)
    c.rows.push({ kind: "series", entry, index: entries.length })
    push(c, entry)
  }
  const addRow = (c: Chapter, picks: Pick[]) => {
    const tiles: Tile[] = []
    for (const p of picks) {
      const [name, crop, focus] = typeof p === "string" ? [p] : p
      const frame = bySingle.get(name)
      if (!frame || used.has(name)) continue
      used.add(name)
      tiles.push({ frame, aspect: crop ?? frame.w / frame.h, focus, index: entries.length })
      push(c, { kind: "single", frame })
    }
    if (tiles.length) c.rows.push({ kind: "row", tiles })
  }

  for (const ch of curated) {
    const c = open(ch.id, ch.title, ch.note)
    for (const line of ch.lines) {
      if (typeof line === "string") addSeries(c, line.slice("series:".length))
      else addRow(c, line)
    }
  }
  // Leftovers: new uploads land in a last chapter, in rows of three.
  const restSeries = series.map((e) => (e as Extract<Entry, { kind: "series" }>).key).filter((k) => !used.has("series:" + k))
  const rest = singles.map((f) => f.name.replace(/\.jpg$/, "")).filter((n) => !used.has(n))
  if (restSeries.length || rest.length) {
    const c = open("more", "More")
    for (const k of restSeries) addSeries(c, k)
    for (let i = 0; i < rest.length; i += 3) addRow(c, rest.slice(i, i + 3))
  }

  return { chapters: chapters.filter((c) => c.rows.length), entries, entryChapter }
}

const built = build()

/** Chapters of layout rows, in viewing order. */
export const chapters: Chapter[] = built.chapters

/** Every viewable item in the same order as the rows (drives the full-screen viewer). */
export const gallery: Entry[] = built.entries

/** The chapter title of each gallery entry, by index. */
export const galleryChapter: string[] = built.entryChapter

/** Single photographs only; used for small previews around the site. */
export const photos: Frame[] = singles
