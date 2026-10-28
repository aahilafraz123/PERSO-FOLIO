import { useEffect, useState } from "react"
import { ProofShot } from "./EmailView"
import { ProjectQuote } from "@/components/testimonials/ProjectQuote"
import { forProject } from "@/content/testimonials"
import { StackList } from "./StackList"
import { useLenis } from "@/motion/SmoothScroll"
import { ArrowUpRight, Check, Link2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { Project } from "@/content/projects"
import { logos } from "@/components/logos"
import { cn } from "@/lib/utils"

type Props = { project: Project | undefined; onClose: () => void }

export function ProjectDialog({ project, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const lenis = useLenis()
  const open = !!project

  // Freeze the page behind the dialog.
  useEffect(() => {
    if (!lenis) return
    if (open) lenis.stop()
    else lenis.start()
  }, [open, lenis])

  const copy = async () => {
    if (!project) return
    await navigator.clipboard.writeText(`${location.origin}/work/${project.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-lenis-prevent
        className="theme-light max-h-[92dvh] overflow-y-auto overscroll-contain border border-hairline bg-background p-0 ring-0 sm:max-w-4xl sm:rounded-[28px] data-open:slide-in-from-bottom-8 data-open:zoom-in-[0.97] data-open:duration-500"
      >
        {project && (
          <article>
            <div className="space-y-12 p-6 md:p-12">
              <header>
                <p className="eyebrow mb-3">
                  {project.org} · {project.period}
                </p>
                <DialogTitle className="text-4xl font-semibold tracking-tighter md:text-6xl">{project.title}</DialogTitle>
                <DialogDescription className="mt-4 max-w-2xl text-xl leading-snug text-foreground/90 md:text-2xl">
                  {project.headline}
                </DialogDescription>
              </header>

              <div className="grid grid-cols-3 gap-3">
                {project.metrics.map((m) => (
                  <div key={m.label} className="rounded-2xl bg-[#f5f5f7] p-4 md:p-5">
                    <p className="text-2xl font-semibold tracking-tight md:text-4xl">{m.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <section>
                  <h3 className="eyebrow mb-3">Overview</h3>
                  <p className="text-[15px] leading-relaxed text-foreground/85">{project.summary}</p>
                </section>
                <section>
                  <h3 className="eyebrow mb-3">My role</h3>
                  <p className="text-[15px] leading-relaxed text-foreground/85">{project.role}</p>
                </section>
              </div>

              <section>
                <h3 className="eyebrow mb-4">Highlights</h3>
                <ul className="space-y-3">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-[15px] text-foreground/85">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ember" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="eyebrow mb-4">Built with</h3>
                <StackList items={project.stack} />
              </section>

              {forProject(project.slug).length > 0 && (
                <section>
                  <h3 className="eyebrow mb-4">What the team said</h3>
                  <div className="space-y-4">
                    {forProject(project.slug).map((t) => (
                      <ProjectQuote key={t.id} t={t} />
                    ))}
                  </div>
                </section>
              )}

              {project.receipt && (
                <section>
                  <h3 className="eyebrow mb-4">Proof</h3>
                  <ProofShot receipt={project.receipt} />
                  <p className="mt-3 text-sm text-muted-foreground">The original email. Click it to read it full size.</p>
                </section>
              )}

              {project.note && <p className="font-mono text-xs text-dim">{project.note}</p>}

            </div>

            {/* Pinned to the bottom of the modal so the code link is always one click away. */}
            <footer className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-hairline bg-background/85 px-6 py-4 backdrop-blur-xl md:px-12">
              {project.links?.map((l) => {
                const repo = l.href.includes("github.com")
                const nasa = l.href.includes("spaceappschallenge.org")
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5",
                      repo && "bg-foreground text-background",
                      nasa && "bg-[#0B3D91] text-white",
                      !repo && !nasa && "border border-hairline hover:bg-black/5",
                    )}
                  >
                    {(repo || nasa) && <img src={repo ? logos.github : logos.nasa} alt="" className="size-4 brightness-0 invert" />}
                    {l.label} <ArrowUpRight className="size-4" />
                  </a>
                )
              })}
              <button onClick={copy} className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline px-5 text-sm font-semibold transition-colors hover:bg-black/5">
                {copied ? <Check className="size-4 text-[#34c759]" /> : <Link2 className="size-4" />}
                {copied ? "Link copied" : "Copy link"}
              </button>
            </footer>
          </article>
        )}
      </DialogContent>
    </Dialog>
  )
}
