import { useNavigate, useParams } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { bySlug } from "@/content/projects"
import { profile } from "@/content/profile"
import { logos } from "@/components/logos"
import { BrandIcon } from "@/components/BrandIcon"
import { ProjectDialog } from "@/components/work/ProjectDialog"
import { WorkHero } from "@/components/work/WorkHero"
import { PlainWords } from "@/components/work/PlainWords"
import { ProjectIndex } from "@/components/work/ProjectIndex"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function Work() {
  usePageMeta("Work — Aahil Afraz", "Projects by Aahil Afraz, with results and links to the code.")
  const { slug } = useParams()
  const navigate = useNavigate()

  return (
    <main className="theme-light w-full max-w-full overflow-x-clip">
      <WorkHero />
      <PlainWords />
      <ProjectIndex />

      <section className="border-t border-hairline bg-[#f5f5f7]">
        <div className="container-x grid gap-12 py-24 md:grid-cols-2">
          <div>
            <h2 className="display-md">Toolkit</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-full border border-hairline px-4 py-2 text-sm text-foreground/80">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="display-md">Credentials</h2>
              <a
                href={`${profile.links.linkedin}details/certifications/`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:border-[#0a66c2]/30 hover:bg-[#0a66c2]/5 hover:text-[#0a66c2]"
              >
                <BrandIcon name="linkedin" className="size-3.5 text-[#0a66c2]" />
                View certifications on LinkedIn
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            <ul className="mt-8 space-y-4 text-foreground/80">
              <li className="flex justify-between gap-4 border-b border-hairline pb-4">
                <span>{profile.school}</span>
              </li>
              {profile.certs.map((c) => (
                <li key={c} className="flex justify-between gap-4 border-b border-hairline pb-4">
                  <span>{c}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs text-dim">
                    <img src={logos.microsoft} alt="" className="size-3.5" />
                    Microsoft Certified
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ProjectDialog project={bySlug(slug)} onClose={() => navigate("/work", { preventScrollReset: true })} />
    </main>
  )
}
