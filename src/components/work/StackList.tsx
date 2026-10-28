import type { ComponentType, CSSProperties } from "react"
import {
  siAngular,
  siChartdotjs,
  siClaude,
  siElectron,
  siExpress,
  siFastapi,
  siGithubactions,
  siGooglecloud,
  siGooglemaps,
  siGraphql,
  siJavascript,
  siKubernetes,
  siLangchain,
  siMacos,
  siModelcontextprotocol,
  siMysql,
  siNasa,
  siPython,
  siReact,
  siRedis,
  siSupabase,
  type SimpleIcon,
} from "simple-icons"
import { AudioLines, Bot, CandlestickChart, CloudSun, Landmark, Map, Mic, RefreshCw, Wind, Wrench, type LucideProps } from "lucide-react"
import azure from "@/assets/logos/azure.svg"
import aws from "@/assets/logos/aws.svg"
import { cn } from "@/lib/utils"

type Mark = { si: SimpleIcon } | { img: string; hex: string } | { icon: ComponentType<LucideProps>; hex?: string }

/** Logo for each tool. Brand marks where they exist; a colored line icon for services without one. */
const marks: Record<string, Mark> = {
  React: { si: siReact },
  Hooks: { si: siReact },
  Angular: { si: siAngular },
  JavaScript: { si: siJavascript },
  Python: { si: siPython },
  Electron: { si: siElectron },
  Express: { si: siExpress },
  FastAPI: { si: siFastapi },
  GraphQL: { si: siGraphql },
  MySQL: { si: siMysql },
  Redis: { si: siRedis },
  Supabase: { si: siSupabase },
  Kubernetes: { si: siKubernetes },
  LangChain: { si: siLangchain },
  MCP: { si: siModelcontextprotocol },
  Claude: { si: siClaude },
  "GitHub Actions": { si: siGithubactions },
  "Google Maps": { si: siGooglemaps },
  "Google Vision OCR": { si: siGooglecloud },
  "Chart.js": { si: siChartdotjs },
  "NASA TEMPO": { si: siNasa },
  macOS: { si: siMacos },
  Azure: { img: azure, hex: "0078D4" },
  "AWS Batch": { img: aws, hex: "FF9900" },
  // No genuine logo for these: shown as plain neutral icons rather than faking a brand color.
  "GPT-4": { icon: Bot },
  Whisper: { icon: Mic },
  "faster-whisper": { icon: Mic },
  OpenAQ: { icon: Wind },
  OpenWeather: { icon: CloudSun },
  "SEC EDGAR": { icon: Landmark },
  Finnhub: { icon: CandlestickChart },
  BlackHole: { icon: AudioLines },
  Maps: { icon: Map },
  Scrum: { icon: RefreshCw },
}

/** Brand color for a mark. Near-black brands (Express, MCP, macOS) use the text color so they stay visible; marks with no genuine logo have no hex and stay neutral. */
function brandColor(mark?: Mark): string | undefined {
  if (!mark) return undefined
  const hex = "si" in mark ? mark.si.hex : mark.hex
  if (!hex) return undefined
  const n = parseInt(hex, 16)
  const l = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
  return l < 40 ? undefined : `#${hex}`
}

function Logo({ mark }: { mark?: Mark }) {
  const cls = "size-4 shrink-0"
  if (!mark) return <Wrench className={cls} aria-hidden />
  if ("si" in mark)
    return (
      <svg viewBox="0 0 24 24" className={cn(cls, "fill-current")} aria-hidden>
        <path d={mark.si.path} />
      </svg>
    )
  // Azure and AWS ship as full-color logo files; show them as they are.
  if ("img" in mark) return <img src={mark.img} alt="" aria-hidden className={cn(cls, "object-contain")} />
  const Icon = mark.icon
  return <Icon className={cls} strokeWidth={2} aria-hidden />
}

/** "Built with": brand-colored logo + name pills, each logo on a soft tint of its own color. */
export function StackList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((name) => {
        const mark = marks[name]
        const brand = brandColor(mark)
        const style = (brand ? { "--brand": brand, color: brand } : undefined) as CSSProperties | undefined
        return (
          <li
            key={name}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-foreground/[0.02] py-1.5 pl-1.5 pr-3.5 text-sm text-foreground/85 transition-colors duration-300 hover:border-foreground/20 hover:text-foreground"
          >
            <span
              style={style}
              className={cn(
                "grid size-7 place-items-center rounded-full",
                brand ? "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)]" : "bg-foreground/[0.07] text-foreground",
              )}
            >
              <Logo mark={mark} />
            </span>
            {name}
          </li>
        )
      })}
    </ul>
  )
}
