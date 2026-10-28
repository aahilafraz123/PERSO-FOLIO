#!/usr/bin/env python3
"""
Converts originals in /photos (git-ignored) into web copies for the site.

  python3 scripts/photos.py

  IMG_1234.JPG  -> src/assets/photos/img-1234.jpg     (+ .thumb.jpg)
  DPT1.JPG      -> src/assets/photos/series-dpt/1.jpg (series: letters + PT + frame number)
  Work.JPG      -> src/assets/photos/work.jpg         (any other plain name, lowercased)

Full copies are 1800px on the long side, thumbnails 900px (square series frames: 1800 / 1000).
Existing outputs are left alone, so it's safe to re-run after adding photos.
Skipped: Finder duplicates ("IMG_1989 2.JPG") and camera-roll UUID names (usually exports,
like cover art, that belong somewhere else). Updates manifest.json with pixel sizes.
Run scripts/ambient.py afterwards so the Studio's ambient light knows the new photos.
Needs only macOS `sips` and the stdlib.
"""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "photos")
OUT = os.path.join(ROOT, "src/assets/photos")
MANIFEST = os.path.join(OUT, "manifest.json")

UUID = re.compile(r"^[0-9A-F]{8}-[0-9A-F]{4}-", re.I)


def target(name):
    stem, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg") or " " in stem or UUID.match(stem):
        return None
    if m := re.fullmatch(r"IMG_(\d+)", stem, re.I):
        return f"img-{m[1]}.jpg"
    if m := re.fullmatch(r"([A-Z]+PT)(\d+)", stem):
        return f"series-{m[1].lower()}/{m[2]}.jpg"
    return re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-") + ".jpg"


def size(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], check=True, capture_output=True, text=True).stdout
    return [int(re.search(rf"{k}: (\d+)", out)[1]) for k in ("pixelWidth", "pixelHeight")]


def resize(src, dst, long_side, quality):
    subprocess.run(["sips", "-Z", str(long_side), "-s", "format", "jpeg", "-s", "formatOptions", str(quality), src, "--out", dst], check=True, capture_output=True)


def main():
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    added = []
    for name in sorted(os.listdir(SRC)):
        rel = target(name)
        if not rel:
            continue
        full = os.path.join(OUT, rel)
        thumb = full.replace(".jpg", ".thumb.jpg")
        os.makedirs(os.path.dirname(full), exist_ok=True)
        if not os.path.exists(full):
            resize(os.path.join(SRC, name), full, 1800, 82)
            added.append(rel)
        if not os.path.exists(thumb):
            w, h = size(full)
            resize(full, thumb, 1000 if w == h else 900, 78)
        manifest[rel] = size(full)
    json.dump(dict(sorted(manifest.items())), open(MANIFEST, "w"), indent=1)
    print(f"{len(added)} new, {len(manifest)} total")
    for rel in added:
        print(f"  + {rel}  {manifest[rel][0]}x{manifest[rel][1]}")


if __name__ == "__main__":
    main()
