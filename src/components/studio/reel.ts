import { gallery, galleryChapter } from "@/content/photos"
import type { LightboxPhoto } from "@/components/PhotoLightbox"

export type ReelPhoto = LightboxPhoto & { thumb: string }

/**
 * Every photo in the Studio as one flat list for the viewer, in the Studio's own order:
 * singles as they are, series frame by frame (each at its own shape), labelled by chapter.
 * Shared by the Studio gallery and the Home carousel so both page through the same reel.
 */
export const reel: ReelPhoto[] = gallery.flatMap((e, i) =>
  e.kind === "single"
    ? [{ name: e.frame.name, ambient: e.frame.name, src: e.frame.src, thumb: e.frame.thumb, w: e.frame.w, h: e.frame.h, label: galleryChapter[i] }]
    : e.frames.map((f, k) => ({
        name: f.name,
        ambient: f.name,
        src: f.src,
        thumb: f.thumb,
        w: f.w,
        h: f.h,
        label: `${galleryChapter[i]} · Frame ${k + 1} of ${e.frames.length}`,
      })),
)

/** Where each gallery entry starts in the reel (a series opens on its first frame). */
export const reelStart: number[] = []
let at = 0
for (const e of gallery) {
  reelStart.push(at)
  at += e.kind === "single" ? 1 : e.frames.length
}
