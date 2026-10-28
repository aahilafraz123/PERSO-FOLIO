import LogoLoop, { type LogoItem } from "@/components/bits/LogoLoop"
import { proof } from "@/components/logos"

const items: LogoItem[] = proof.map((p) => ({
  node: (
    <span className="group flex items-center gap-4 pr-4">
      <img src={p.src} alt={p.alt} className="logo-mono h-8 w-auto" />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-foreground/80">{p.label}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{p.note}</span>
      </span>
    </span>
  ),
  title: p.label,
}))

export function Proof() {
  return (
    <section aria-label="Where I've worked and competed" className="theme-light relative border-b border-hairline pb-10 pt-14 md:pt-16">
      <LogoLoop logos={items} speed={45} gap={96} logoHeight={40} pauseOnHover fadeOut fadeOutColor="#ffffff" ariaLabel="Organizations" />
    </section>
  )
}
