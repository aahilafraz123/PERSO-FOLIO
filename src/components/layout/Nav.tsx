import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { Menu, ArrowUpRight } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { profile } from "@/content/profile"
import { cn } from "@/lib/utils"
import { gsap, useGSAP } from "@/motion/gsap"
import { Magnetic } from "@/motion/Magnetic"

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

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > 240 && y > last)
      last = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
      <nav ref={barRef} aria-label="Primary" className="glass flex h-14 w-full max-w-3xl items-center justify-between rounded-full pl-5 pr-2 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]">
        <Link to="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="relative grid size-7 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
            AA
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#141416] bg-ember" />
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <ul ref={listRef} className="relative hidden items-center md:flex">
          <span ref={pillRef} aria-hidden className="absolute left-0 top-0 h-full rounded-full bg-white/[0.08] opacity-0" />
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "relative block rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
            className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Resume
          </a>
          <Magnetic padding={16} strength={0.25}>
            <Link
              to="/contact"
              className="group flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-semibold text-background transition-transform duration-500 hover:scale-[1.03]"
            >
              Let's talk
              <ArrowUpRight className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="grid size-10 place-items-center rounded-full text-foreground md:hidden" aria-label="Open menu">
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
      </nav>
    </header>
  )
}
