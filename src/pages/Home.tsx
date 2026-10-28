import { HeroFerrofluid } from "@/sections/HeroFerrofluid"
import { Proof } from "@/sections/Proof"
import { Wins } from "@/sections/Wins"
import { Persona } from "@/sections/Persona"
import { SelectedWork } from "@/sections/SelectedWork"
import { Testimonials } from "@/sections/Testimonials"
import { StudioTeaser } from "@/sections/StudioTeaser"
import { HireCTA } from "@/sections/HireCTA"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function Home() {
  usePageMeta("Aahil Afraz — Engineer & Designer")
  return (
    <>
      <HeroFerrofluid />
      {/* The sheet that rises over the hero (see HeroFerrofluid). */}
      <div data-hero-sheet className="relative z-10 overflow-hidden rounded-t-[28px] bg-background shadow-[0_-30px_70px_-30px_rgb(0_0_0/0.45)] md:rounded-t-[48px]">
        <Proof />
        <Wins />
        <Persona />
        <SelectedWork />
        <Testimonials />
        <StudioTeaser />
        <HireCTA />
      </div>
    </>
  )
}
