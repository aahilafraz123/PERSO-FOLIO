import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Nav } from "@/components/layout/Nav"
import { Footer } from "@/components/layout/Footer"
import { MiniPlayer } from "@/components/layout/MiniPlayer"
import { PageTransition } from "@/components/layout/PageTransition"
import { SmoothScroll } from "@/motion/SmoothScroll"
import { AudioProvider } from "@/audio/AudioProvider"
import Home from "@/pages/Home"

const Work = lazy(() => import("@/pages/Work"))
const Studio = lazy(() => import("@/pages/Studio"))
const Contact = lazy(() => import("@/pages/Contact"))
const Vault = lazy(() => import("@/pages/Vault"))
const NotFound = lazy(() => import("@/pages/NotFound"))

export default function App() {
  return (
    <TooltipProvider>
      <AudioProvider>
        <SmoothScroll>
          <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
            Skip to content
          </a>
          <Nav />
          <div id="content" className="w-full max-w-full overflow-x-clip">
            <PageTransition>
              {/*
                The page is a sheet that lifts off the footer, above it in z. The rounded bottom edge is a
                clip-path rather than border-radius + overflow, because clip-path also clips fixed layers
                inside pages (the Studio's ambient light), which would otherwise paint over the footer.
              */}
              <div className="relative z-10 overflow-x-clip bg-background [clip-path:inset(0_round_0_0_28px_28px)] md:[clip-path:inset(0_round_0_0_48px_48px)]">
                <Suspense fallback={<div className="min-h-svh" />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/work/:slug?" element={<Work />} />
                    <Route path="/studio" element={<Studio />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
            </PageTransition>
          </div>
          <MiniPlayer />
          <Toaster position="bottom-center" />
        </SmoothScroll>
      </AudioProvider>
    </TooltipProvider>
  )
}
