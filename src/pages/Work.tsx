import { useNavigate, useParams } from "react-router"
import { ArrowUpRight } from "lucide-react"
import { bySlug } from "@/content/projects"
import { profile } from "@/content/profile"
import { allBuilds } from "@/content/vault"
import { logos } from "@/components/logos"
import { BrandIcon } from "@/components/BrandIcon"
import { ProjectDialog } from "@/components/work/ProjectDialog"
import { WorkHero } from "@/components/work/WorkHero"
import { Builds } from "@/components/vault/Builds"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function Work() {
  usePageMeta("Work — Aahil Afraz", "Projects by Aahil Afraz, with results and links to the code.")
  const { slug } = useParams()
  const navigate = useNavigate()

  return (
    <main className="theme-light relative isolate w-full max-w-full overflow-x-clip">
      {/* Absolute, not fixed, so it ends where the page does instead of painting over the footer. */}
      <div aria-hidden className="vault-bg pointer-events-none absolute inset-0 -z-10" />
      <WorkHero />
      <Builds items={allBuilds} title={null} writeups />

      <section aria-label="Toolkit and credentials" className="container-x pb-24 md:pb-32">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-hairline bg-white p-7 md:p-8">
            <p className="eyebrow">Toolkit</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em]">What I build with.</h2>
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <li key={s} className="rounded-md bg-foreground/[0.06] px-2.5 py-1 font-mono text-[12px] text-foreground/80">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-3xl border border-hairline bg-white p-7 md:p-8">
            <p className="eyebrow">Credentials</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.025em]">{profile.school}</h2>
            <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
              {profile.certs.map((c) => (
                <li key={c} className="flex items-center justify-between gap-4 py-3.5 text-[15px]">
                  <span>{c}</span>
                  <img src={logos.microsoft} alt="Microsoft Certified" className="size-4 shrink-0" />
                </li>
              ))}
            </ul>
            <a
              href={`${profile.links.linkedin}details/certifications/`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-10 items-center gap-2 self-start rounded-full border border-foreground/15 px-4 text-[13px] font-semibold transition-colors hover:border-foreground/30"
            >
              <BrandIcon name="linkedin" className="size-3.5 text-[#0a66c2]" /> Verify on LinkedIn <ArrowUpRight className="size-3.5 opacity-60" />
            </a>
          </div>
        </div>
      </section>

      <ProjectDialog project={bySlug(slug)} onClose={() => navigate("/work", { preventScrollReset: true })} />
    </main>
  )
}
