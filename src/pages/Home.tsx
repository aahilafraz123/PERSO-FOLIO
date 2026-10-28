import { HeroThreads } from "@/sections/HeroThreads"
import { Persona } from "@/sections/Persona"
import { Builds } from "@/components/vault/Builds"
import { Recommendations } from "@/components/vault/Recommendations"
import { homeBuilds } from "@/content/vault"
import { StudioTeaser } from "@/sections/StudioTeaser"
import { HireCTA } from "@/sections/HireCTA"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function Home() {
  usePageMeta("Aahil Afraz — Engineer & Designer")
  return (
    <>
      <HeroThreads />
      {/* About carries on from the hero's dark with no seam (see HeroThreads). No clip or rounded edge on
          this tall wrapper: either one makes the GPU draw it as a single surface taller than it can hold. */}
      <div className="relative">
        {/* About rides up over the second half of the dive, see-through for its first lines, so the threads
            bleed into the About text and only fade out behind it. Solid once the hero has scrolled away. */}
        <div className="relative z-10 bg-[linear-gradient(to_bottom,transparent_45svh,#050505_110svh)] motion-safe:-mt-[110svh] [&>section]:bg-transparent!">
          <Persona />
        </div>
        {/* Projects and recommendations, as on the recruiter page. */}
        <div className="theme-light vault-bg">
          <Builds items={homeBuilds} title="Selected work." writeups allLink />
          <Recommendations />
        </div>
        <StudioTeaser />
        <HireCTA />
      </div>
    </>
  )
}
