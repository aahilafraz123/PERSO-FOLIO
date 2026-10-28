import { useEffect, useRef } from "react"
import { Link } from "react-router"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import FuzzyText from "@/components/bits/FuzzyText"
import { profile } from "@/content/profile"
import { ANCHORS, SCREEN_RECTS, STUDIO_FRAMES } from "@/content/studio"
import { PlayRandom } from "@/components/PlayRandom"
import { useLenis } from "@/motion/SmoothScroll"

/*
 * The studio. An empty room at night, generated as one push-in shot and cut into frames
 * (public/studio). One scroll dollies the camera from the doorway to the monitor:
 * the chair in the foreground falls away, the things on the desk get labelled as you pass
 * them, the screen types out who lives here, and then you dive into its light, which is
 * the white page below.
 *
 * Layers, back to front: frames on a canvas, labels pinned to objects in the footage,
 * a panel pinned to the monitor screen, the chair (a separate cutout), then the copy.
 */

type Tag = {
  key: keyof typeof ANCHORS
  dir: "up" | "down" | "left"
  kicker: string
  title: string
  /** Scroll window in u (0 to 1): fade in from a to b, out from c to d. */
  win: [number, number, number, number]
}

const TAGS: Tag[] = [
  { key: "cityHall", dir: "left", kicker: "01 · Based in", title: "Philadelphia, PA", win: [0.03, 0.11, 0.3, 0.4] },
  { key: "camera", dir: "down", kicker: "02 · Photographer", title: "Photography in the Studio", win: [0.1, 0.18, 0.5, 0.6] },
  { key: "synth", dir: "down", kicker: "03 · Musician", title: `Makes music as ${profile.artistName}`, win: [0.16, 0.25, 0.52, 0.62] },
  { key: "pencils", dir: "left", kicker: "04 · Designer", title: "Designs what I build", win: [0.3, 0.38, 0.62, 0.7] },
]

const PROMPT = "aahil@studio ~ % whoami"
const LINES = ["Software engineer at Zaro Health.", "Shipped at Comcast.", "NASA Space Apps 2025 Global Nominee."]
const CODA = "I designed, built and scored everything you're about to see."
const TYPED = [PROMPT, ...LINES, CODA]
const TYPED_TOTAL = TYPED.reduce((n, l) => n + l.length, 0)

/**
 * The screen's colour as it appears on the page (the footage's 252 245 232 after the canvas grade
 * in index.css), so the panel laid over it is invisible until it carries text.
 */
const SCREEN_RGB = [224, 217, 205] as const

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
/** Scroll progress over the forward glide: matches the pinned timeline's dolly, hold and dive. */
const glideIn = (t: number) =>
  t < 0.6 ? 0.8 * easeInOutSine(t / 0.6) : t < 0.8 ? 0.8 + 0.07 * ((t - 0.6) / 0.2) : 0.87 + 0.13 * ((t - 0.8) / 0.2) ** 2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)
const windowed = (u: number, [a, b, c, d]: Tag["win"]) => smooth(clamp01((u - a) / (b - a))) * (1 - smooth(clamp01((u - c) / (d - c))))

/*
 * The video eases in and out on its own and its first frames barely move. Scrolling frame by
 * frame would feel sticky, so map scroll to the screen's (log) size instead: equal scroll,
 * equal felt zoom.
 */
const zoomCurve = (() => {
  const out: number[] = []
  for (const [, , w] of SCREEN_RECTS) out.push(Math.max(out.at(-1) ?? -Infinity, Math.log(w)))
  return out
})()
function frameAt(u: number) {
  const z0 = zoomCurve[0]
  const target = lerp(z0, zoomCurve[zoomCurve.length - 1], clamp01(u))
  for (let i = 1; i < zoomCurve.length; i++) {
    if (zoomCurve[i] >= target) {
      const span = zoomCurve[i] - zoomCurve[i - 1]
      return span > 0 ? i - 1 + (target - zoomCurve[i - 1]) / span : i
    }
  }
  return STUDIO_FRAMES - 1
}
function anchorAt(keys: readonly (readonly [number, number, number])[], f: number): [number, number] {
  if (f <= keys[0][0]) return [keys[0][1], keys[0][2]]
  for (let i = 1; i < keys.length; i++) {
    const [f1, x1, y1] = keys[i]
    if (f <= f1) {
      const [f0, x0, y0] = keys[i - 1]
      const t = (f - f0) / (f1 - f0)
      return [lerp(x0, x1, t), lerp(y0, y1, t)]
    }
  }
  const last = keys[keys.length - 1]
  return [last[1], last[2]]
}
function screenAt(f: number) {
  const i = Math.min(STUDIO_FRAMES - 2, Math.floor(f))
  const t = clamp01(f - i)
  const a = SCREEN_RECTS[i]
  const b = SCREEN_RECTS[i + 1]
  return a.map((v, k) => lerp(v, b[k], t)) as [number, number, number, number]
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pin = useRef<ScrollTrigger | null>(null)
  const lenis = useLenis()

  useGSAP(
    () => {
      const section = root.current!
      const cvs = canvas.current!
      const ctx = cvs.getContext("2d")!
      const reduced = prefersReducedMotion()

      // Portrait screens get a native-resolution centre crop of the footage, so the room stays sharp.
      const crop = window.matchMedia("(max-aspect-ratio: 1/1)").matches
      const set = crop ? "sm" : "lg"
      const frames: (HTMLImageElement | null)[] = Array(STUDIO_FRAMES).fill(null)

      const state = { u: 0, dive: 0 }
      let dirty = true
      const mark = () => (dirty = true)

      const tagEls = gsap.utils.toArray<HTMLElement>(".studio-tag", section)
      const screenEl = section.querySelector<HTMLElement>(".studio-screen")!
      const screenBg = section.querySelector<HTMLElement>(".studio-screen-bg")!
      const screenText = section.querySelector<HTMLElement>(".studio-screen-text")!
      const typedEls = gsap.utils.toArray<HTMLElement>("[data-typed]", section)
      // Made here rather than in JSX: it hops between lines as they type, outside React's tree.
      const cursor = document.createElement("span")
      cursor.className = "studio-cursor"
      typedEls[0].after(cursor)

      // Layout of the cover-fitted footage, in CSS px of the room layer.
      let W = 0
      let H = 0
      let dpr = 1
      let fit = { ox: 0, oy: 0, dw: 0, dh: 0 }
      const measure = () => {
        W = cvs.clientWidth
        H = cvs.clientHeight
        dpr = Math.min(window.devicePixelRatio || 1, 1.75)
        cvs.width = Math.round(W * dpr)
        cvs.height = Math.round(H * dpr)
        const iw = crop ? 960 : 1920
        const ih = 1088
        const s = Math.max(W / iw, H / ih)
        fit = { dw: iw * s, dh: ih * s, ox: (W - iw * s) / 2, oy: (H - ih * s) / 2 }
        dirty = true
      }
      const project = (nx: number, ny: number): [number, number] => [
        fit.ox + (crop ? (nx - 0.25) / 0.5 : nx) * fit.dw,
        fit.oy + ny * fit.dh,
      ]

      const nearest = (i: number) => {
        for (let d = 0; d < STUDIO_FRAMES; d++) {
          if (frames[i - d]) return frames[i - d]
          if (frames[i + d]) return frames[i + d]
        }
        return null
      }

      let typedShown = -1
      const render = () => {
        if (!dirty || !W) return
        dirty = false
        const f = frameAt(state.u)
        const i = Math.floor(f)
        const t = f - i

        // Room: the two nearest frames, cross-faded, so 73 frames scrub like 145.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.imageSmoothingQuality = "high"
        const a = frames[i] ?? nearest(i)
        if (a) {
          ctx.globalAlpha = 1
          ctx.drawImage(a, fit.ox, fit.oy, fit.dw, fit.dh)
          const b = frames[i + 1]
          if (b && t > 0.02) {
            ctx.globalAlpha = t
            ctx.drawImage(b, fit.ox, fit.oy, fit.dw, fit.dh)
          }
        }

        // Labels ride on their objects.
        tagEls.forEach((el, k) => {
          const tag = TAGS[k]
          const [x, y] = project(...anchorAt(ANCHORS[tag.key], f))
          const inView = x > 12 && x < W - 12 && y > 12 && y < H - 12
          const v = inView ? windowed(state.u, tag.win) : 0
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + (1 - v) * 10).toFixed(1)}px, 0)`
          el.style.opacity = v.toFixed(3)
          el.style.setProperty("--reveal", v.toFixed(3))
        })

        // The screen panel: pinned to the monitor, then grows to swallow the frame.
        const [cx, cy, sw, sh] = screenAt(f)
        const [px, py] = project(cx, cy)
        const rw = sw * fit.dw * (crop ? 2 : 1)
        const rh = sh * fit.dh
        const d = smooth(state.dive)
        const left = lerp(px - rw / 2, -48, d)
        const top = lerp(py - rh / 2, -48, d)
        const width = lerp(rw, W + 96, d)
        const height = lerp(rh, H + 96, d)
        screenEl.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`
        screenEl.style.width = `${width.toFixed(1)}px`
        screenEl.style.height = `${height.toFixed(1)}px`
        // Text sits on the part of the screen that's on-screen (on a phone the monitor outgrows the
        // viewport), and its size follows the monitor so it reads as being on it, not over it.
        const m = 40
        const tl = Math.max(px - rw / 2, m)
        const tt = Math.max(py - rh / 2, m)
        const tw = Math.max(0, Math.min(px + rw / 2, W - m) - tl)
        const th = Math.max(0, Math.min(py + rh / 2, H - m) - tt)
        screenText.style.transform = `translate3d(${tl.toFixed(1)}px, ${tt.toFixed(1)}px, 0)`
        screenText.style.width = `${tw.toFixed(1)}px`
        screenText.style.height = `${th.toFixed(1)}px`
        screenText.style.fontSize = `${Math.max(5, Math.min(rw * 0.034, tw * 0.06)).toFixed(2)}px`
        const panel = smooth(clamp01((state.u - 0.38) / 0.12))
        const [r, g, bl] = SCREEN_RGB.map((c) => Math.round(lerp(c, 255, d)))
        screenBg.style.backgroundColor = `rgb(${r} ${g} ${bl})`
        screenBg.style.opacity = Math.max(panel, d).toFixed(3)
        screenText.style.opacity = (1 - smooth(clamp01(state.dive * 2.2))).toFixed(3)

        const typed = Math.round(TYPED_TOTAL * clamp01((state.u - 0.45) / 0.4))
        if (typed !== typedShown) {
          typedShown = typed
          let left = typed
          let at = 0
          typedEls.forEach((el, k) => {
            const full = TYPED[k]
            const n = Math.max(0, Math.min(full.length, left))
            el.textContent = full.slice(0, n)
            el.parentElement!.style.display = k === 0 || n > 0 ? "" : "none"
            if (n > 0) at = k
            left -= full.length
          })
          if (typedEls[at].nextSibling !== cursor) typedEls[at].after(cursor)
        }
      }

      // Frames: first one now, then coarse-to-fine so a fast scroll always has something close.
      const order: number[] = []
      for (const stride of [8, 4, 2, 1])
        for (let k = 0; k < STUDIO_FRAMES; k += stride) if (!order.includes(k)) order.push(k)
      let cursorAt = 0
      const loadNext = (): Promise<void> | void => {
        const k = order[cursorAt++]
        if (k === undefined) return
        const img = new Image()
        img.decoding = "async"
        img.src = `/studio/${set}/${String(k).padStart(2, "0")}.webp`
        return img
          .decode()
          .then(() => {
            frames[k] = img
            dirty = true
          })
          .catch(() => {})
          .then(() => loadNext())
      }
      let cancelled = false
      const first = new Image()
      first.src = `/studio/${set}/00.webp`
      first
        .decode()
        .then(() => {
          if (cancelled) return
          frames[0] = first
          dirty = true
          section.classList.add("is-ready")
          if (reduced) return
          cursorAt = 1
          for (let n = 0; n < 4; n++) loadNext()
        })
        .catch(() => section.classList.add("is-ready"))

      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(cvs)
      gsap.ticker.add(render)

      // Entrance.
      const intro = gsap.timeline({ delay: 0.15 })
      intro
        .from(".studio-room", { scale: 1.08, filter: "brightness(0)", duration: 2.2, ease: "power2.out" }, 0)
        .fromTo(
          ".studio-chair-img",
          { yPercent: 18, filter: "blur(18px) brightness(0.4)" },
          { yPercent: 0, filter: "blur(1px) brightness(0.85)", duration: 1.8, ease: "expo.out" },
          0.2,
        )
        .from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.8 }, 0.5)
        .from(".hero-name", { y: 28, opacity: 0, filter: "blur(14px)", duration: 1.3, ease: "expo.out" }, 0.6)
        .from(".hero-tagline", { y: 18, opacity: 0, duration: 0.9 }, 0.85)
        .from(".hero-cta > *", { y: 18, opacity: 0, stagger: 0.06, duration: 0.9 }, 1)
        .from(".hero-scroll", { opacity: 0, duration: 0.8 }, 1.4)

      const cleanups: (() => void)[] = [
        () => {
          cancelled = true
          cursor.remove()
          ro.disconnect()
          gsap.ticker.remove(render)
        },
      ]

      if (reduced) return () => cleanups.forEach((c) => c())

      // Pointer parallax: the chair is close to you, the room is far, so they part a little.
      if (window.matchMedia("(pointer: fine)").matches) {
        const roomX = gsap.quickTo(".studio-room-drift", "x", { duration: 1.2, ease: "power3.out" })
        const roomY = gsap.quickTo(".studio-room-drift", "y", { duration: 1.2, ease: "power3.out" })
        const chairX = gsap.quickTo(".studio-chair-drift", "x", { duration: 1, ease: "power3.out" })
        const chairY = gsap.quickTo(".studio-chair-drift", "y", { duration: 1, ease: "power3.out" })
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          roomX(nx * -14)
          roomY(ny * -8)
          chairX(nx * -46)
          chairY(ny * -18)
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        cleanups.push(() => window.removeEventListener("pointermove", onMove))
      }

      // The page after the hero is pulled up by the hero's height, so it sits exactly under the
      // pinned hero when the pin ends: the dive into the screen lands straight on it.
      const after = document.querySelector<HTMLElement>("[data-hero-after]")
      const tuck = () => {
        if (after) after.style.marginTop = `-${section.offsetHeight}px`
      }
      tuck()
      ScrollTrigger.addEventListener("refreshInit", tuck)
      cleanups.push(() => {
        ScrollTrigger.removeEventListener("refreshInit", tuck)
        if (after) after.style.marginTop = ""
      })

      const tl = gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=170%",
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
          },
        })
        // Dolly to the desk, hold a beat on the typed screen, then dive into it.
        .to(state, { u: 1, duration: 0.78, ease: "power1.inOut", onUpdate: mark }, 0.02)
        .to(state, { dive: 1, duration: 0.1, ease: "power2.in", onUpdate: mark }, 0.88)
        .to(".hero-scroll-wrap", { autoAlpha: 0, y: 24, duration: 0.06 }, 0)
        .fromTo(".hero-top", { filter: "blur(0px)" }, { autoAlpha: 0, y: -60, scale: 0.94, filter: "blur(12px)", duration: 0.16, ease: "power1.in" }, 0)
        .fromTo(".hero-bottom", { filter: "blur(0px)" }, { autoAlpha: 0, y: 70, filter: "blur(10px)", duration: 0.12, ease: "power1.in" }, 0)
        .to(".studio-shade", { autoAlpha: 0, duration: 0.2 }, 0.02)
        // The camera rolls forward past the chair: it drops out of the bottom corner, close and soft.
        // Kept moving outward fast and barely scaled, so the blurred dark shape never veils the room.
        // Explicit start: ScrollTrigger records start values on refresh, mid-intro, which would
        // otherwise make the chair begin from the intro's blurred, dimmed state.
        .fromTo(
          ".studio-chair-img",
          { yPercent: 0, xPercent: 0, rotate: 0, scale: 1, filter: "blur(1px) brightness(0.85)" },
          {
            yPercent: 115,
            xPercent: -34,
            rotate: -5,
            scale: 1.18,
            filter: "blur(12px) brightness(0.6)",
            duration: 0.3,
            ease: "power1.in",
            immediateRender: false,
          },
          0.02,
        )
        .to(section, { autoAlpha: 0, duration: 0.02 }, 0.98)
      pin.current = tl.scrollTrigger ?? null
      cleanups.push(() => (pin.current = null))

      return () => cleanups.forEach((c) => c())
    },
    { scope: root },
  )

  // One scroll: the first nudge of the wheel inside the pin hands over to a single eased glide
  // through the whole dolly (or back out of it), instead of asking for a dozen wheel clicks.
  // ScrollTrigger's own snap fights Lenis, so this drives Lenis directly. Touch keeps native
  // scrolling: a swipe already covers the distance, and momentum would fight a programmatic glide.
  useEffect(() => {
    if (!lenis || !window.matchMedia("(pointer: fine)").matches) return
    let playing = false
    let last = lenis.scroll
    const onScroll = () => {
      const st = pin.current
      const y = lenis.scroll
      const dir = Math.sign(y - last)
      last = y
      if (!st || playing || !dir) return
      const span = st.end - st.start
      const p = (y - st.start) / span
      if (p <= 0.001 || p >= 0.995) return
      const forward = dir > 0
      const target = forward ? st.end + 2 : st.start
      playing = true
      lenis.scrollTo(target, {
        duration: forward ? Math.max(1, (1 - p) * 4.2) : Math.max(0.9, p * 2.4),
        // In: the dolly, a slow beat while the screen is readable, then the dive. Out: one ease.
        easing: forward && p < 0.1 ? glideIn : easeInOutSine,
        lock: true,
        onComplete: () => {
          playing = false
          last = lenis.scroll
        },
      })
    }
    lenis.on("scroll", onScroll)
    return () => lenis.off("scroll", onScroll)
  }, [lenis])

  return (
    <>
      <section ref={root} className="studio relative z-10 h-[100svh] min-h-[560px] overflow-hidden bg-[#070505]">
        {/* Back: the room. The drift wrapper takes pointer parallax, the inner layer takes scroll. */}
        <div className="studio-room-drift absolute -inset-6">
          <div className="studio-room absolute inset-0 origin-[50%_52%]">
            <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
            {/* Film treatment over the footage only: moving grain and a lens vignette hide the
                video's compression. Labels and the screen sit above it and stay clean. */}
            <div aria-hidden className="studio-grain" />
            <div aria-hidden className="studio-vignette" />

            {TAGS.map((t) => (
              <div key={t.key} aria-hidden className="studio-tag" data-dir={t.dir} style={{ opacity: 0 }}>
                <span className="studio-tag-dot" />
                <span className="studio-tag-line" />
                <span className="studio-tag-card">
                  <span className="studio-tag-kicker">{t.kicker}</span>
                  <span className="studio-tag-title">{t.title}</span>
                </span>
              </div>
            ))}

            <div aria-hidden className="studio-screen">
              <div className="studio-screen-bg" />
            </div>
            <div aria-hidden className="studio-screen-text">
              <p className="studio-prompt">
                <span data-typed />
              </p>
              {LINES.map((l) => (
                <p key={l} className="studio-line">
                  <span data-typed />
                </p>
              ))}
              <p className="studio-coda">
                <span data-typed />
              </p>
            </div>
          </div>
        </div>

        {/* Shading for the copy: dusk at the top for the name, floor shadow at the bottom for the buttons. */}
        <div aria-hidden className="studio-shade pointer-events-none absolute inset-0" />

        {/* Front: the empty chair, a separate cutout so it can fall away faster than the room. */}
        <div className="studio-chair-drift pointer-events-none absolute bottom-0 left-[-30vw] w-[96vw] sm:left-[-6vw] sm:w-[58vw] lg:left-[-3vw] lg:w-[44vw] lg:max-w-[820px]">
          <img
            src="/studio/chair.webp"
            alt=""
            aria-hidden
            width={1400}
            height={891}
            className="studio-chair-img block w-full origin-bottom-left translate-y-[6%]"
          />
        </div>

        <div className="hero-top container-x absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-[clamp(6rem,14vh,9rem)] text-center">
          <p className="hero-eyebrow eyebrow mb-5 text-white/70 [text-shadow:0_1px_12px_rgb(0_0_0/0.9)]">
            Philadelphia<span className="mx-2 opacity-50">·</span>Welcome in
          </p>
          {/* The name is the headline, drawn as a faint signal-noise shimmer that swells on hover.
              The canvas carries no text, so the heading keeps the name for screen readers and search. */}
          <h1 className="hero-title hero-name w-full">
            <span className="sr-only">{profile.name}</span>
            <span aria-hidden className="block">
              <FuzzyText
                fontSize="clamp(3rem, 10vw, 7.5rem)"
                fontWeight={600}
                letterSpacing="-0.045em"
                gradient={["#ffffff", "#ece6df", "#a39a92"]}
                gradientDirection="vertical"
                baseIntensity={0.12}
                hoverIntensity={0.34}
                fuzzRange={16}
                transitionDuration={260}
                fps={45}
                className="mx-auto block h-auto max-w-full"
              >
                {profile.name}
              </FuzzyText>
            </span>
          </h1>
          <p className="hero-tagline mt-3 text-[clamp(1.25rem,2.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em] text-white/90 [text-shadow:0_1px_16px_rgb(0_0_0/0.9)]">
            Software engineer with taste.
          </p>
          {/* What the monitor types out on the way in, for readers that don't scroll a canvas. */}
          <p className="sr-only">
            {LINES.join(" ")} {CODA}
          </p>
        </div>

        <div className="hero-bottom absolute inset-x-0 bottom-[clamp(4.5rem,11vh,7rem)] z-10 flex flex-col items-center">
          <div className="hero-cta flex flex-wrap items-center justify-center gap-3">
            <div>
              <Link
                to="/work"
                className="group inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-[#1d1d1f] transition-transform duration-300 hover:scale-[1.03]"
              >
                See the work
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div>
              <Link
                to="/contact"
                className="inline-flex h-13 items-center rounded-full border border-white/20 bg-black/55 px-7 text-[15px] font-semibold text-white backdrop-blur-md transition-colors duration-300 hover:bg-black/70"
              >
                Book a call
              </Link>
            </div>
          </div>
          {/* The site has a soundtrack: one tap plays a random track of mine. */}
          <div className="hero-cta mt-4 flex justify-center">
            <div>
              <PlayRandom />
            </div>
          </div>
        </div>

        <div className="hero-scroll-wrap absolute bottom-6 left-1/2 z-10 -translate-x-1/2 motion-reduce:hidden">
          <div className="hero-scroll flex flex-col items-center gap-2 text-white/50">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll in</span>
            <ArrowDown className="size-4 animate-bounce" />
          </div>
        </div>
      </section>
      {/* Seam: eases the dark hero into the white section when the scroll animation is off (reduced motion). */}
      <div aria-hidden className="hero-seam h-[26vh] min-h-40 motion-safe:hidden" />
    </>
  )
}
