import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { Menu, ArrowUpRight } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { profile } from "@/content/profile"
import { cn } from "@/lib/utils"
import { gsap, useGSAP } from "@/motion/gsap"
import { Magnetic } from "@/motion/Magnetic"
import GlassSurface from "@/components/bits/GlassSurface"

const links = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/studio", label: "Studio" },
  { to: "/contact", label: "Contact" },
]

export function Nav() {
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const listRef = useRef<HTMLUListElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLElement>(null)

  // On the home page only: hide on scroll down, reveal on scroll up. Every other page keeps it in place.
  const autoHide = pathname === "/"
  useEffect(() => {
    setHidden(false)
    if (!autoHide) return
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > 240 && y > last)
      last = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [autoHide])

  // Also reveal on hover near the top edge: scroll wheel input over an
  // embedded iframe (e.g. the Cal.com booking widget) never bubbles out to
  // the page, so scroll-up alone can strand the nav hidden underneath it.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.clientY < 72) setHidden(false)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  // The glass is clear, so the text follows what's behind it: dark over light pages, white over dark ones.
  const [onLight, setOnLight] = useState(false)
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const bar = barRef.current
      if (!bar) return
      const r = bar.getBoundingClientRect()
      const y = r.top + r.height / 2
      let sum = 0
      let n = 0
      for (const x of [r.left + 40, r.left + r.width / 2, r.right - 40]) {
        for (const el of document.elementsFromPoint(x, y)) {
          if (rootRef.current?.contains(el)) continue
          const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)
          if (!m || (m.length > 3 && Number(m[3]) < 0.5)) continue
          sum += (0.2126 * Number(m[0]) + 0.7152 * Number(m[1]) + 0.0722 * Number(m[2])) / 255
          n++
          break
        }
      }
      if (n) setOnLight(sum / n > 0.55)
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    queue()
    // Page transitions settle after the route changes, so look again once they have.
    const late = setTimeout(queue, 900)
    window.addEventListener("scroll", queue, { passive: true })
    window.addEventListener("resize", queue)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(late)
      window.removeEventListener("scroll", queue)
      window.removeEventListener("resize", queue)
    }
  }, [pathname])

  // Sliding active pill.
  useEffect(() => {
    const list = listRef.current
    const pill = pillRef.current
    if (!list || !pill) return
    const active = list.querySelector<HTMLElement>("[aria-current='page']")
    if (!active) {
      gsap.to(pill, { opacity: 0, duration: 0.3 })
      return
    }
    gsap.to(pill, {
      x: active.offsetLeft,
      width: active.offsetWidth,
      opacity: 1,
      duration: 0.7,
      ease: "expo.out",
    })
  }, [pathname])

  useGSAP(() => {
    gsap.from(barRef.current, { y: -40, opacity: 0, duration: 1.4, delay: 0.2, ease: "expo.out" })
  })

  return (
    <header
      ref={rootRef}
      className={cn(
        "fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-transform duration-700 ease-[var(--ease-out-expo)]",
        hidden && !open && "-translate-y-40",
      )}
    >
      {/* React Bits Glass Surface, Tab Bar preset: clear glass that bends whatever scrolls under it at the
          edges (frosted in Safari and Firefox). */}
      <nav ref={barRef} aria-label="Primary" className="w-full max-w-3xl rounded-full">
        <GlassSurface
          width="100%"
          height={60}
          borderRadius={30}
          borderWidth={0.07}
          distortionScale={-180}
          displace={0.5}
          backgroundOpacity={0.1}
          className="[&>div]:p-0"
          style={{ colorScheme: onLight ? "light" : "dark" }}
        >
          <div
            className={cn(
              "relative flex h-full w-full items-center justify-between pl-5 pr-2.5 transition-colors duration-500",
              onLight ? "text-[#1d1d1f]" : "text-white",
            )}
          >
            <Link to="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
              <span
                className={cn(
                  "relative grid size-7 place-items-center rounded-full text-[11px] font-bold transition-colors duration-500",
                  onLight ? "bg-[#1d1d1f] text-white" : "bg-white text-[#1d1d1f]",
                )}
              >
                AA
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ember" />
              </span>
              <span className="hidden sm:inline">{profile.name}</span>
            </Link>

            <ul ref={listRef} className="relative hidden items-center md:flex">
              <span ref={pillRef} aria-hidden className={cn("absolute left-0 top-0 h-full rounded-full opacity-0", onLight ? "bg-black/[0.07]" : "bg-white/[0.12]")} />
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "relative block rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                        isActive ? "" : "opacity-70 hover:opacity-100",
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1.5">
              <a
                href={profile.links.resume}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium opacity-70 transition-opacity hover:opacity-100 sm:block"
              >
                Resume
              </a>
              <Magnetic padding={16} strength={0.25}>
                <Link
                  to="/contact"
                  className={cn(
                    "group flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-[transform,background-color,color] duration-500 hover:scale-[1.03]",
                    onLight ? "bg-[#1d1d1f] text-white" : "bg-white text-[#1d1d1f]",
                  )}
                >
                  Let's talk
                  <ArrowUpRight className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="grid size-10 place-items-center rounded-full md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent side="top" className="border-hairline bg-[#0a0a0b]/95 px-6 pb-10 pt-20 backdrop-blur-2xl">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <ul className="space-y-1">
                    {links.map((l, i) => (
                      <li key={l.to} style={{ animationDelay: `${i * 60}ms` }} className="animate-in fade-in slide-in-from-top-4 fill-mode-both duration-700">
                        <NavLink
                          to={l.to}
                          end={l.to === "/"}
                          className={({ isActive }) =>
                            cn("block py-2 text-4xl font-semibold tracking-tight", isActive ? "text-foreground" : "text-muted-foreground")
                          }
                        >
                          {l.label}
                        </NavLink>
                      </li>
                    ))}
                    <li className="pt-4">
                      <a href={profile.links.resume} target="_blank" rel="noreferrer" className="text-lg text-muted-foreground">
                        Resume ↗
                      </a>
                    </li>
                  </ul>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </GlassSurface>
      </nav>
    </header>
  )
}
