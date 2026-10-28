import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { Aperture, ArrowUp, ArrowUpRight, BadgeCheck, CalendarDays, FileText, LayoutGrid, Mail } from "lucide-react"
import { profile, about } from "@/content/profile"
import { BrandIcon } from "@/components/BrandIcon"
import { useLenis } from "@/motion/SmoothScroll"
import { useSectionKey } from "@/hooks/useSectionKey"
import { cn } from "@/lib/utils"
import { HalftoneField } from "./HalftoneField"
import { PlayerCard } from "./MiniPlayer"
import { setPlayerDocked } from "./playerDock"

/**
 * The page's last chapter. On wide screens the page lifts off it (the content sheet has
 * rounded bottom corners and the footer sits pinned underneath); where the footer is taller
 * than the window it just scrolls in, so none of it can hide under the page.
 * Top to bottom: one closing line with the next step, every link in one row with its icon,
 * live details plus the player's docking slot, and the name set in the halftone field.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const [reveal, setReveal] = useState(false)
  const onContact = useSectionKey() === "contact"
  const lenis = useLenis()

  useEffect(() => {
    const el = root.current
    if (!el) return
    const check = () => setReveal(window.innerWidth >= 768 && el.offsetHeight <= window.innerHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    window.addEventListener("resize", check)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", check)
    }
  }, [])

  // While the player slot is actually uncovered, the floating player docks into it. The footer
  // sits pinned under the page, so "on screen" isn't enough: the slot counts once the page's
  // bottom edge has lifted above it (and it's inside the window).
  useEffect(() => {
    const el = slot.current
    const sheet = root.current?.previousElementSibling
    if (!el || !sheet) return
    let raf = 0
    const check = () => {
      raf = 0
      const s = el.getBoundingClientRect()
      setPlayerDocked(sheet.getBoundingClientRect().bottom <= s.top + s.height * 0.4 && s.bottom <= window.innerHeight + s.height * 0.4)
    }
    const queue = () => (raf ||= requestAnimationFrame(check))
    check()
    window.addEventListener("scroll", queue, { passive: true })
    window.addEventListener("resize", queue)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", queue)
      window.removeEventListener("resize", queue)
      setPlayerDocked(false)
    }
  }, [])

  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }))
  const now = about.facts.find((f) => f.label === "Now")

  return (
    <footer ref={root} className={cn("theme-dark relative z-0 overflow-hidden bg-[#050505]", reveal && "sticky bottom-0")}>
      {/* Closing line: the one next step, or on the Contact page, a way back up. */}
      <div className="container-x pt-24 md:pt-32">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">{onContact ? "That's everything" : "What's next"}</p>
            <h2 className="display-lg mt-5 max-w-4xl text-balance">{onContact ? "Thanks for stopping by." : "Have something in mind?"}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {onContact ? (
              <button onClick={toTop} className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:scale-[1.03]">
                Back to top <ArrowUp className="size-4" />
              </button>
            ) : (
              <>
                <Link to="/contact" className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:scale-[1.03]">
                  Start a project <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                </Link>
                <Link to="/contact#book" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-[15px] font-semibold transition-colors hover:bg-white/5">
                  <CalendarDays className="size-4" /> Book a call
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Every link, one row, each with its mark. */}
        <nav aria-label="Footer" className="mt-16 flex flex-wrap items-center gap-x-7 gap-y-4 border-y border-white/10 py-6 md:mt-20">
          <FootLink to="/work" icon={<LayoutGrid className="size-4" />}>Work</FootLink>
          <FootLink to="/studio" icon={<Aperture className="size-4" />}>Studio</FootLink>
          <FootLink to="/contact" icon={<Mail className="size-4" />}>Contact</FootLink>
          <FootLink href={profile.links.resume} icon={<FileText className="size-4" />}>Resume</FootLink>
          <FootLink to="/vault" icon={<BadgeCheck className="size-4" />}>For recruiters</FootLink>
          <span aria-hidden className="hidden h-5 w-px bg-white/15 sm:block" />
          <FootLink href={profile.links.linkedin} icon={<BrandIcon name="linkedin" className="size-4" />} hover="group-hover:text-[#0a66c2]">LinkedIn</FootLink>
          <FootLink href={profile.links.github} icon={<BrandIcon name="github" className="size-4" />}>GitHub</FootLink>
          <FootLink href={profile.links.spotify} icon={<BrandIcon name="spotify" className="size-4" />} hover="group-hover:text-[#1db954]">Spotify</FootLink>
          <FootLink href={profile.links.appleMusic} icon={<BrandIcon name="applemusic" className="size-4" />} hover="group-hover:text-[#fa2d48]">Apple Music</FootLink>
        </nav>

        {/* Live details, and the slot the player docks into. */}
        <div className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <LocalTime />
            {now?.href && (
              <a href={now.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                Now at {now.value.split(",")[0]} <ArrowUpRight className="size-3" />
              </a>
            )}
            <span>© {new Date().getFullYear()} {profile.name}</span>
            {!onContact && (
              <button onClick={toTop} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                Back to top <ArrowUp className="size-3" />
              </button>
            )}
          </div>
          <div ref={slot} className="w-full md:w-[min(380px,40vw)]">
            <PlayerCard />
          </div>
        </div>
      </div>

      <Wordmark />
    </footer>
  )
}

function FootLink({ to, href, icon, hover, children }: { to?: string; href?: string; icon: ReactNode; hover?: string; children: ReactNode }) {
  const cls = "group inline-flex items-center gap-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
  const mark = <span className={cn("transition-colors", hover)}>{icon}</span>
  return to ? (
    <Link to={to} className={cls}>
      {mark}
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {mark}
      {children}
    </a>
  )
}

/** "3:42 AM in Philadelphia": when a reply is likely, better than coordinates. */
function LocalTime() {
  const fmt = () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 20_000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#34c759] opacity-60 motion-reduce:animate-none" />
        <span className="relative size-2 rounded-full bg-[#34c759]" />
      </span>
      {time} in {profile.location.split(",")[0]}
    </span>
  )
}

/**
 * The name, full width, cut off at the bottom edge. The halftone field shows only through the
 * letters: an SVG mask punches the name out of a footer-coloured sheet laid over the canvas.
 */
function Wordmark() {
  // useId can contain characters that break url(#…), so keep only safe ones.
  const mask = `wm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  return (
    <div aria-hidden className="relative mt-6 w-full select-none" style={{ aspectRatio: "1000 / 150" }}>
      <HalftoneField />
      <svg viewBox="0 0 1000 150" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <mask id={mask}>
            <rect x="-20" y="-20" width="1040" height="190" fill="white" />
            <text x="0" y="172" textLength="1000" lengthAdjust="spacing" fontSize="216" fontWeight="600" letterSpacing="-8" fill="black">
              {profile.name}
            </text>
          </mask>
        </defs>
        {/* Oversized so no sliver of the canvas shows past the edges after rounding. */}
        <rect x="-20" y="-20" width="1040" height="190" fill="#050505" mask={`url(#${mask})`} />
      </svg>
    </div>
  )
}
