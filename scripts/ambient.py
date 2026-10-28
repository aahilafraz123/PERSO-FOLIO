#!/usr/bin/env python3
"""
Builds src/content/ambient.json: a tiny blur source and a dominant tone for every
photo and track cover, used by the Studio page's ambient background.

  python3 scripts/ambient.py

Re-run after adding photos or covers. Needs only macOS `sips` and the stdlib.

Keys: photo names as in photos.ts ("img-1989.jpg", "series-dpt/1.jpg") and
"track:<slug>" for covers. Values: { "img": data URI (24px JPEG), "tone": "#rrggbb" }.
"""
import base64, colorsys, json, os, struct, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, "src/assets/photos")
COVERS = os.path.join(ROOT, "public/music/covers")
OUT = os.path.join(ROOT, "src/content/ambient.json")
SIZE = 24


def sips(src, dst, *args):
    subprocess.run(["sips", *args, src, "--out", dst], check=True, capture_output=True)


def pixels(bmp_path):
    """Minimal BMP reader: returns [(r, g, b), ...]."""
    b = open(bmp_path, "rb").read()
    off, w, h, bpp = struct.unpack_from("<I", b, 10)[0], *struct.unpack_from("<ii", b, 18), struct.unpack_from("<H", b, 28)[0]
    step, row = bpp // 8, ((bpp * w + 31) // 32) * 4
    out = []
    for y in range(abs(h)):
        for x in range(w):
            i = off + y * row + x * step
            out.append((b[i + 2], b[i + 1], b[i]))
    return out


def tone(px):
    """Saturation-weighted average, so a photo's colour wins over its greys and blacks."""
    tot = [0.0, 0.0, 0.0]
    wsum = 0.0
    for r, g, b in px:
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        w = (s * (1 - abs(2 * l - 1))) ** 1.5 + 0.02
        tot = [tot[0] + r * w, tot[1] + g * w, tot[2] + b * w]
        wsum += w
    r, g, b = (c / wsum / 255 for c in tot)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    # Keep it a mid-tone: the page darkens it further, but it must never read as grey or neon.
    r, g, b = colorsys.hls_to_rgb(h, min(max(l, 0.35), 0.55), min(s * 1.25, 0.85))
    return "#%02x%02x%02x" % tuple(round(c * 255) for c in (r, g, b))


def entry(src, tmp):
    jpg, bmp = os.path.join(tmp, "a.jpg"), os.path.join(tmp, "a.bmp")
    sips(src, jpg, "-Z", str(SIZE), "-s", "format", "jpeg", "-s", "formatOptions", "70")
    sips(jpg, bmp, "-s", "format", "bmp")
    data = base64.b64encode(open(jpg, "rb").read()).decode()
    return {"img": f"data:image/jpeg;base64,{data}", "tone": tone(pixels(bmp))}


def main():
    out = {}
    with tempfile.TemporaryDirectory() as tmp:
        for dirpath, _, files in os.walk(PHOTOS):
            for f in files:
                if f.endswith(".thumb.jpg"):
                    rel = os.path.relpath(os.path.join(dirpath, f), PHOTOS).replace(".thumb.jpg", ".jpg")
                    out[rel] = entry(os.path.join(dirpath, f), tmp)
        for f in os.listdir(COVERS):
            if f.endswith(".sm.jpg"):
                out["track:" + f[: -len(".sm.jpg")]] = entry(os.path.join(COVERS, f), tmp)
    json.dump(dict(sorted(out.items())), open(OUT, "w"), indent=0, separators=(",", ":"))
    print(f"{len(out)} entries, {os.path.getsize(OUT) // 1024} KB -> {os.path.relpath(OUT, ROOT)}")
    for k, v in sorted(out.items()):
        print(f"  {v['tone']}  {k}")


if __name__ == "__main__":
    main()
