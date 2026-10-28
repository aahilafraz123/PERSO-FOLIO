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
                The page is a sheet that lifts off the footer, above it in z. Its rounded bottom corners are two
                small caps in the footer's colour, not a clip-path: a clip-path on the whole page made the GPU
                draw a surface as tall as the page, and past 16,384 device pixels (the home page at 2x) Chrome
                can't hold it in one texture, so WebGL and animated layers flickered or stopped painting.
                Pages keep their backdrops absolute + sticky rather than fixed, so nothing paints over the footer.
              */}
              <div className="relative z-10 overflow-x-clip bg-background">
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
                <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-50 size-7 bg-[radial-gradient(circle_at_100%_0,transparent_27.5px,#050505_28px)] md:size-12 md:bg-[radial-gradient(circle_at_100%_0,transparent_47.5px,#050505_48px)]" />
                <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 z-50 size-7 bg-[radial-gradient(circle_at_0_0,transparent_27.5px,#050505_28px)] md:size-12 md:bg-[radial-gradient(circle_at_0_0,transparent_47.5px,#050505_48px)]" />
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
