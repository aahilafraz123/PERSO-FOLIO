import { logos } from "./logos"
import { cn } from "@/lib/utils"

type Name = keyof typeof logos

/** Renders a brand SVG as a single-color mask so it inherits currentColor. */
export function BrandIcon({ name, className }: { name: Name; className?: string }) {
  const url = `url("${logos[name]}")`
  return (
    <span
      aria-hidden
      className={cn("inline-block size-4 shrink-0 bg-current", className)}
      style={{ maskImage: url, WebkitMaskImage: url, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
    />
  )
}
