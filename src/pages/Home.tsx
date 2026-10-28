import { HeroFerrofluid } from "@/sections/HeroFerrofluid"
import { Proof } from "@/sections/Proof"
import { Wins } from "@/sections/Wins"
import { Persona } from "@/sections/Persona"
import { Builds } from "@/components/vault/Builds"
import { Recommendations } from "@/components/vault/Recommendations"
import { allBuilds } from "@/content/vault"
import { StudioTeaser } from "@/sections/StudioTeaser"
import { HireCTA } from "@/sections/HireCTA"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function Home() {
  usePageMeta("Aahil Afraz — Engineer & Designer")
  return (
    <>
      <HeroFerrofluid />
      {/* The sheet that rises over the hero (see HeroFerrofluid). */}
      {/* overflow-clip, not hidden: hidden would make the sheet a scroll container and stop the project rows sticking. */}
      <div data-hero-sheet className="relative z-10 overflow-clip rounded-t-[28px] bg-background shadow-[0_-30px_70px_-30px_rgb(0_0_0/0.45)] md:rounded-t-[48px]">
        <Proof />
        <Wins />
        <Persona />
        {/* Projects and recommendations, as on the recruiter page. */}
        <div className="theme-light vault-bg">
          <Builds items={allBuilds.slice(0, 5)} title="Selected work." writeups allLink />
          <Recommendations />
        </div>
        <StudioTeaser />
        <HireCTA />
      </div>
    </>
  )
}
